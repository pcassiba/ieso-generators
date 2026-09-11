/**
 * IESO Generator Output and Capability XML Parser & Data Processor
 * Google-style light theme data engine
 */

export const SECTION_KEYS = {
  NUCLEAR: 'Nuclear',
  GAS: 'Gas',
  HYDRO: 'Hydro',
  WIND: 'Wind',
  BATTERIES: 'Batteries',
  OTHER: 'Other'
};

export const ORDERED_SECTIONS = [
  SECTION_KEYS.NUCLEAR,
  SECTION_KEYS.GAS,
  SECTION_KEYS.HYDRO,
  SECTION_KEYS.WIND,
  SECTION_KEYS.BATTERIES
];

// Reference rated capacity (MW) for standard nuclear facilities and units
const NUCLEAR_INSTALLED_RATINGS = {
  'Bruce': 6550,
  'Darlington': 3512,
  'Pickering': 2064
};

const NUCLEAR_UNIT_RATINGS = {
  'BRUCEA-G1': 828, 'BRUCEA-G2': 828, 'BRUCEA-G3': 795, 'BRUCEA-G4': 795,
  'BRUCEB-G5': 795, 'BRUCEB-G6': 817, 'BRUCEB-G7': 817, 'BRUCEB-G8': 817,
  'DARLINGTON-G1': 878, 'DARLINGTON-G2': 878, 'DARLINGTON-G3': 878, 'DARLINGTON-G4': 878,
  'PICKERINGB-G5': 344, 'PICKERINGB-G6': 344, 'PICKERINGB-G7': 344, 'PICKERINGB-G8': 344
};

/**
 * Determine generator unit status
 * Green (online): Output > 0 MW
 * Yellow (idle): Output == 0 MW, but unit has capability / is available
 * Red (outage): Output == 0 MW and Capability / AvailCapacity == 0 MW
 */
export function getUnitStatus(outputMW, capabilityMW, availMW) {
  if (outputMW > 0) {
    return { status: 'online', color: 'green', label: 'Online' };
  }
  
  if (availMW > 0 || (availMW === undefined && capabilityMW > 0)) {
    return { status: 'idle', color: 'yellow', label: 'Not generating' };
  }
  
  return { status: 'outage', color: 'red', label: 'Outage' };
}

/**
 * Extract short chip unit label (e.g. G1, G2, G3, U1)
 */
export function getShortUnitLabel(genName) {
  const name = genName.trim();

  const match = name.match(/[-_\s]+(G\d+|U\d+|T\d+|UNIT\d+|UN\d+|GS|BESS)\b/i);
  if (match) {
    let label = match[1].toUpperCase();
    if (label.startsWith('UNIT')) {
      return 'U' + label.slice(4);
    }
    return label;
  }

  const matchEnd = name.match(/(G\d+|U\d+)$/i);
  if (matchEnd) {
    return matchEnd[1].toUpperCase();
  }

  const matchNumAtEnd = name.match(/(\d+)$/);
  if (matchNumAtEnd && matchNumAtEnd[1].length <= 2) {
    return 'G' + matchNumAtEnd[1];
  }

  return '1';
}

/**
 * Extract clean facility name from generator name and fuel type
 */
export function extractFacilityName(genName, fuelType) {
  const name = genName.trim();
  const fuel = (fuelType || '').toUpperCase();

  if (fuel === 'NUCLEAR' || name.startsWith('BRUCE') || name.startsWith('DARLINGTON') || name.startsWith('PICKERING')) {
    if (name.startsWith('BRUCE')) return 'Bruce';
    if (name.startsWith('DARLINGTON')) return 'Darlington';
    if (name.startsWith('PICKERING')) return 'Pickering';
  }

  let cleaned = name;

  cleaned = cleaned.replace(/[-_\s]+(LT\.G\d+|G\d+|U\d+|UNIT\d+|UN\d+|TG\d+|CT\d+|ST\d+|T\d+|AG_T\d+|AG_SR|SR)\b/gi, '');
  cleaned = cleaned.replace(/[-_]+G\d+$/gi, '');
  
  cleaned = cleaned.replace(/GS$/i, ' GS')
                   .replace(/CGS$/i, ' CGS')
                   .replace(/CTS$/i, ' CTS')
                   .replace(/PGS$/i, ' PGS')
                   .replace(/BESS$/i, ' BESS')
                   .replace(/SF$/i, ' SF')
                   .replace(/WF$/i, ' WF');

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  const titleCased = cleaned.split(' ').map(word => {
    const upper = word.toUpperCase();
    if (['BESS', 'CGS', 'CTS', 'PGS', 'GS', 'WF', 'SF', 'HRPP', 'NRWF'].includes(upper)) {
      return upper;
    }
    if (word.length <= 2 && !['ON', 'IN', 'OF', 'AT', 'TO'].includes(word.toLowerCase())) {
      return word.toUpperCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');

  return titleCased;
}

/**
 * Map fuel type from XML to target section key
 */
export function mapFuelToSection(fuelType, genName) {
  const fuel = (fuelType || '').toUpperCase();
  const name = (genName || '').toUpperCase();

  if (fuel === 'NUCLEAR') return SECTION_KEYS.NUCLEAR;
  if (fuel === 'GAS') return SECTION_KEYS.GAS;
  if (fuel === 'HYDRO') return SECTION_KEYS.HYDRO;
  if (fuel === 'WIND') return SECTION_KEYS.WIND;

  if (fuel === 'OTHER' || name.includes('BESS') || name.includes('BATTERY') || name.includes('STORAGE')) {
    return SECTION_KEYS.BATTERIES;
  }

  return SECTION_KEYS.OTHER;
}

/**
 * Default fallback ratings by fuel type if capability is zero and no sister unit is available
 */
function getDefaultFuelRating(fuelType) {
  const fuel = (fuelType || '').toUpperCase();
  if (fuel === 'GAS') return 150;
  if (fuel === 'HYDRO') return 50;
  if (fuel === 'WIND') return 50;
  if (fuel === 'BATTERIES' || fuel === 'OTHER') return 25;
  return 50;
}

/**
 * Parse IESO Generator Output XML String into structured data
 * @param {string} xmlString - Raw XML content
 * @param {number|null} selectedHour - Optional hour selector
 * @param {string} sortBy - 'capability' | 'output'
 */
export function parseIesoXml(xmlString, selectedHour = null, sortBy = 'capability') {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse XML document: ' + parseError.textContent);
  }

  const createdAtNode = xmlDoc.querySelector('CreatedAt') || xmlDoc.querySelector('*|CreatedAt');
  const dateNode = xmlDoc.querySelector('Date') || xmlDoc.querySelector('*|Date');

  const createdAt = createdAtNode ? createdAtNode.textContent : new Date().toISOString();
  const reportDate = dateNode ? dateNode.textContent : new Date().toISOString().split('T')[0];

  const generatorNodes = Array.from(xmlDoc.querySelectorAll('Generator') || xmlDoc.querySelectorAll('*|Generator'));

  const hoursFound = new Set();
  generatorNodes.forEach(genNode => {
    const outputs = Array.from(genNode.querySelectorAll('Output') || genNode.querySelectorAll('*|Output'));
    outputs.forEach(outNode => {
      const hNode = outNode.querySelector('Hour') || outNode.querySelector('*|Hour');
      if (hNode) hoursFound.add(parseInt(hNode.textContent, 10));
    });
  });

  const availableHours = Array.from(hoursFound).sort((a, b) => a - b);
  const activeHour = selectedHour && availableHours.includes(selectedHour)
    ? selectedHour
    : (availableHours.length > 0 ? Math.max(...availableHours) : 1);

  const sectionsMap = {};
  Object.values(SECTION_KEYS).forEach(secKey => {
    sectionsMap[secKey] = {
      key: secKey,
      title: secKey,
      totalOutputMW: 0,
      totalCapabilityMW: 0,
      totalUnavailableMW: 0,
      facilitiesCount: 0,
      unitsCount: 0,
      outageFacilitiesCount: 0,
      outageUnitsCount: 0,
      facilitiesMap: {}
    };
  });

  let totalGeneratorsProcessed = 0;

  generatorNodes.forEach(genNode => {
    const nameNode = genNode.querySelector('GeneratorName') || genNode.querySelector('*|GeneratorName');
    const fuelNode = genNode.querySelector('FuelType') || genNode.querySelector('*|FuelType');

    if (!nameNode) return;

    const genName = nameNode.textContent.trim();
    const fuelType = fuelNode ? fuelNode.textContent.trim() : 'UNKNOWN';

    // Get active hour metric
    const getMetricForHour = (selectorTag) => {
      const nodes = Array.from(genNode.querySelectorAll(selectorTag) || genNode.querySelectorAll(`*|${selectorTag}`));
      for (const node of nodes) {
        const hNode = node.querySelector('Hour') || node.querySelector('*|Hour');
        if (hNode && parseInt(hNode.textContent, 10) === activeHour) {
          const valNode = node.querySelector('EnergyMW') || node.querySelector('*|EnergyMW');
          return valNode ? parseInt(valNode.textContent, 10) || 0 : 0;
        }
      }
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        const valNode = lastNode.querySelector('EnergyMW') || lastNode.querySelector('*|EnergyMW');
        return valNode ? parseInt(valNode.textContent, 10) || 0 : 0;
      }
      return 0;
    };

    // Calculate max capability across 24h for rating detection
    const getMaxMetricAcrossFile = (selectorTag) => {
      const nodes = Array.from(genNode.querySelectorAll(selectorTag) || genNode.querySelectorAll(`*|${selectorTag}`));
      let maxVal = 0;
      nodes.forEach(node => {
        const valNode = node.querySelector('EnergyMW') || node.querySelector('*|EnergyMW');
        const val = valNode ? parseInt(valNode.textContent, 10) || 0 : 0;
        if (val > maxVal) maxVal = val;
      });
      return maxVal;
    };

    const outputMW = getMetricForHour('Output');
    const capabilityMW = getMetricForHour('Capability');
    const availMW = getMetricForHour('AvailCapacity');

    const maxCap24h = getMaxMetricAcrossFile('Capability');
    const maxAvail24h = getMaxMetricAcrossFile('AvailCapacity');
    const maxCapabilityMW = Math.max(capabilityMW, maxCap24h, maxAvail24h);

    const statusInfo = getUnitStatus(outputMW, capabilityMW, availMW);
    const shortLabel = getShortUnitLabel(genName);

    const sectionKey = mapFuelToSection(fuelType, genName);
    const facilityName = extractFacilityName(genName, fuelType);

    const unitObj = {
      genName,
      shortLabel,
      facilityName,
      fuelType,
      outputMW,
      capabilityMW,
      availMW,
      maxCapabilityMW,
      unavailableMW: 0,
      status: statusInfo.status,
      color: statusInfo.color,
      statusLabel: statusInfo.label
    };

    const section = sectionsMap[sectionKey];

    if (!section.facilitiesMap[facilityName]) {
      section.facilitiesMap[facilityName] = {
        name: facilityName,
        sectionKey,
        fuelType,
        totalOutputMW: 0,
        totalCapabilityMW: 0,
        totalUnavailableMW: 0,
        outageUnitsCount: 0,
        installedRatingMW: NUCLEAR_INSTALLED_RATINGS[facilityName] || 0,
        units: []
      };
    }

    const facility = section.facilitiesMap[facilityName];
    facility.units.push(unitObj);
    facility.totalOutputMW += outputMW;
    facility.totalCapabilityMW += capabilityMW;

    section.totalOutputMW += outputMW;
    section.totalCapabilityMW += capabilityMW;
    section.unitsCount++;

    totalGeneratorsProcessed++;
  });

  // Second pass: Calculate facility unit max ratings and unavailable MW for outages
  Object.keys(sectionsMap).forEach(secKey => {
    const sec = sectionsMap[secKey];
    Object.values(sec.facilitiesMap).forEach(fac => {
      // Find highest unit capability in facility to serve as fallback rating
      const facMaxUnitCap = Math.max(
        ...fac.units.map(u => Math.max(u.maxCapabilityMW, u.capabilityMW, u.availMW)),
        0
      );

      fac.units.forEach(unit => {
        if (unit.status === 'outage') {
          const ratedCap = NUCLEAR_UNIT_RATINGS[unit.genName] ||
            (unit.maxCapabilityMW > 0 ? unit.maxCapabilityMW : null) ||
            (facMaxUnitCap > 0 ? facMaxUnitCap : null) ||
            getDefaultFuelRating(unit.fuelType);

          unit.unavailableMW = Math.max(0, ratedCap - unit.availMW);
        } else {
          unit.unavailableMW = 0;
        }
      });

      fac.outageUnits = fac.units.filter(u => u.status === 'outage');
      fac.outageUnitsCount = fac.outageUnits.length;
      fac.totalUnavailableMW = fac.outageUnits.reduce((sum, u) => sum + u.unavailableMW, 0);

      sec.totalUnavailableMW += fac.totalUnavailableMW;
      if (fac.outageUnitsCount > 0) {
        sec.outageFacilitiesCount++;
        sec.outageUnitsCount += fac.outageUnitsCount;
      }
    });
  });

  // Process facilities list and sort
  const processedSections = Object.keys(sectionsMap).map(key => {
    const sec = sectionsMap[key];
    const facilitiesList = Object.values(sec.facilitiesMap).map(fac => {
      fac.units.sort((a, b) => a.genName.localeCompare(b.genName, undefined, { numeric: true }));
      return fac;
    });

    // Sort facilities by Output MW or Capability MW
    facilitiesList.sort((a, b) => {
      if (sortBy === 'output') {
        if (b.totalOutputMW !== a.totalOutputMW) {
          return b.totalOutputMW - a.totalOutputMW;
        }
        return b.totalCapabilityMW - a.totalCapabilityMW;
      }

      // Default: sort by capability (Nuclear sorted by installed rating)
      if (sec.key === SECTION_KEYS.NUCLEAR) {
        const ratingA = a.installedRatingMW || a.totalCapabilityMW;
        const ratingB = b.installedRatingMW || b.totalCapabilityMW;
        return ratingB - ratingA;
      }
      return b.totalCapabilityMW - a.totalCapabilityMW;
    });

    sec.facilitiesCount = facilitiesList.length;
    sec.facilities = facilitiesList;
    delete sec.facilitiesMap;

    return sec;
  });

  const orderedSectionsList = ORDERED_SECTIONS.map(key => 
    processedSections.find(s => s.key === key)
  ).filter(Boolean);

  const grandTotalUnavailableMW = orderedSectionsList.reduce((sum, s) => sum + (s.totalUnavailableMW || 0), 0);
  const grandTotalOutageUnits = orderedSectionsList.reduce((sum, s) => sum + (s.outageUnitsCount || 0), 0);

  return {
    createdAt,
    reportDate,
    activeHour,
    totalGeneratorsProcessed,
    grandTotalUnavailableMW,
    grandTotalOutageUnits,
    sections: orderedSectionsList
  };
}
