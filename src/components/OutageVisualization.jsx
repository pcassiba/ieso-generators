import React, { useState } from 'react';
import { Atom, Flame, Waves, Wind, BatteryCharging, Sparkles, Layers, Cpu, AlertTriangle } from 'lucide-react';
import { SECTION_KEYS } from '../utils/iesoParser';

const FUEL_ICONS = {
  'NUCLEAR': Atom,
  'GAS': Flame,
  'HYDRO': Waves,
  'WIND': Wind,
  'BATTERIES': BatteryCharging,
  'OTHER': Sparkles
};

const FUEL_OPTIONS = [
  { key: 'all', label: 'All Fuel Types', sectionKey: null, icon: Sparkles, color: 'text-rose-600' },
  { key: SECTION_KEYS.NUCLEAR, label: 'Nuclear', sectionKey: SECTION_KEYS.NUCLEAR, icon: Atom, color: 'text-blue-600' },
  { key: SECTION_KEYS.GAS, label: 'Gas', sectionKey: SECTION_KEYS.GAS, icon: Flame, color: 'text-orange-600' },
  { key: SECTION_KEYS.HYDRO, label: 'Hydro', sectionKey: SECTION_KEYS.HYDRO, icon: Waves, color: 'text-cyan-600' },
  { key: SECTION_KEYS.WIND, label: 'Wind', sectionKey: SECTION_KEYS.WIND, icon: Wind, color: 'text-emerald-600' },
  { key: SECTION_KEYS.BATTERIES, label: 'Batteries', sectionKey: SECTION_KEYS.BATTERIES, icon: BatteryCharging, color: 'text-purple-600' }
];

export default function OutageVisualization({ data, viewMode = 'facility', onViewModeChange, onSelectFacility, onSelectGenerator }) {
  const [fuelFilter, setFuelFilter] = useState('all');

  if (!data || !data.sections) return null;

  const isGeneratorView = viewMode === 'generator';
  const allItems = [];

  const handleItemClick = (item) => {
    if (isGeneratorView) {
      if (onSelectGenerator) onSelectGenerator(item.displayName);
    } else {
      if (onSelectFacility) onSelectFacility(item.displayName);
    }
  };

  // Compute stats per fuel category for the top selector pills
  const fuelStats = {};
  FUEL_OPTIONS.forEach(opt => {
    fuelStats[opt.key] = { unavailMW: 0, count: 0 };
  });

  data.sections.forEach(section => {
    let sKey = section.key;
    if (!fuelStats[sKey]) {
      fuelStats[sKey] = { unavailMW: 0, count: 0 };
    }
    fuelStats[sKey].unavailMW += (section.totalUnavailableMW || 0);
    fuelStats[sKey].count += isGeneratorView ? (section.outageUnitsCount || 0) : (section.outageFacilitiesCount || 0);

    let sectionFuelKey = section.key;
    if (sectionFuelKey === SECTION_KEYS.NUCLEAR) sectionFuelKey = 'NUCLEAR';
    else if (sectionFuelKey === SECTION_KEYS.GAS) sectionFuelKey = 'GAS';
    else if (sectionFuelKey === SECTION_KEYS.HYDRO) sectionFuelKey = 'HYDRO';
    else if (sectionFuelKey === SECTION_KEYS.WIND) sectionFuelKey = 'WIND';
    else if (sectionFuelKey === SECTION_KEYS.BATTERIES) sectionFuelKey = 'BATTERIES';
    else sectionFuelKey = 'OTHER';

    (section.facilities || []).forEach(fac => {
      if (isGeneratorView) {
        // Collect individual outage units
        (fac.units || []).forEach(unit => {
          if (unit.status === 'outage') {
            allItems.push({
              id: unit.genName,
              displayName: unit.genName,
              facilityName: fac.name,
              fuelCategory: sectionFuelKey,
              sectionKey: section.key,
              unavailableMW: unit.unavailableMW || 0,
              availMW: unit.availMW || 0,
              outputMW: unit.outputMW || 0,
              statusLabel: 'Outage'
            });
          }
        });
      } else {
        // Collect facilities with at least 1 outage unit
        if (fac.outageUnitsCount > 0) {
          allItems.push({
            id: fac.name,
            displayName: fac.name,
            facilityName: fac.name,
            fuelCategory: sectionFuelKey,
            sectionKey: section.key,
            outageUnitsCount: fac.outageUnitsCount,
            totalUnitsCount: fac.units.length,
            unavailableMW: fac.totalUnavailableMW || 0,
            statusLabel: 'Outage'
          });
        }
      }
    });
  });

  fuelStats['all'] = {
    unavailMW: data.grandTotalUnavailableMW || 0,
    count: isGeneratorView ? (data.grandTotalOutageUnits || 0) : data.sections.reduce((acc, s) => acc + (s.outageFacilitiesCount || 0), 0)
  };

  // Filter items by selected fuel type
  let filteredRawItems = allItems;
  if (fuelFilter !== 'all') {
    filteredRawItems = allItems.filter(item => item.sectionKey === fuelFilter);
  }

  // Sort strictly by unavailable MW descending
  filteredRawItems.sort((a, b) => b.unavailableMW - a.unavailableMW);

  // Assign rank numbers
  const rankedItems = filteredRawItems.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));

  const baseThreshold = isGeneratorView ? 40 : 80;
  // If filtered items all fall under threshold, adapt threshold to display cards
  const maxUnavail = rankedItems.length > 0 ? rankedItems[0].unavailableMW : 0;
  const threshold = (fuelFilter !== 'all' && maxUnavail < baseThreshold) ? Math.max(1, Math.floor(maxUnavail * 0.5)) : baseThreshold;

  const topItems = rankedItems.filter(item => item.unavailableMW >= threshold);
  const remainingItems = rankedItems.filter(item => item.unavailableMW < threshold);

  const selectedFuelOption = FUEL_OPTIONS.find(o => o.key === fuelFilter) || FUEL_OPTIONS[0];

  return (
    <div class="space-y-4 pt-0.5">
      {/* Top Banner / Summary Header */}
      <div class="bg-rose-50/70 border border-rose-200/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <h2 class="font-bold text-rose-950 text-sm tracking-tight inline">
              Ontario Outage Impact
            </h2>
            <span class="text-rose-400 mx-2">•</span>
            <span class="text-rose-800 font-medium">
              Total Grid Outage Impact: <strong class="text-rose-900 font-extrabold">{data.grandTotalUnavailableMW?.toLocaleString() || 0} MW</strong>
            </span>
          </div>
        </div>

        <div class="text-[11px] text-rose-700 font-semibold bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
          {data.grandTotalOutageUnits || 0} units currently unavailable
        </div>
      </div>

      {/* Fuel Type View Pills (Quick Selector) */}
      <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
        <span class="text-[11px] text-slate-500 font-medium shrink-0 mr-1">Display Fuel:</span>
        {FUEL_OPTIONS.map(opt => {
          const IconComp = opt.icon;
          const stats = fuelStats[opt.key] || { unavailMW: 0, count: 0 };
          const isSelected = fuelFilter === opt.key;

          return (
            <button
              key={opt.key}
              onClick={() => setFuelFilter(opt.key)}
              class={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap border text-xs ${
                isSelected
                  ? 'bg-rose-700 text-white border-rose-800 shadow-xs font-bold'
                  : 'bg-white text-slate-700 hover:bg-rose-50/60 border-slate-200 hover:border-rose-200'
              }`}
            >
              <IconComp class={`w-3.5 h-3.5 ${isSelected ? 'text-white' : opt.color}`} />
              <span>{opt.label}</span>
              <span class={`font-mono text-[10.5px] px-1.5 py-0.2 rounded ${
                isSelected ? 'bg-rose-800 text-rose-100' : 'bg-rose-50 text-rose-800 font-semibold'
              }`}>
                {stats.unavailMW.toLocaleString()} MW
              </span>
            </button>
          );
        })}
      </div>

      {/* Control Bar: Mode Toggle + Dropdown */}
      <div class="bg-white p-2.5 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0" />
          <span class="font-bold text-rose-950 uppercase tracking-tight text-xs">
            {fuelFilter !== 'all' ? `${selectedFuelOption.label} Outage Impact` : (isGeneratorView ? 'Generator Outage Impact Ranking' : 'Facility Outage Impact Ranking')}
          </span>
          <span class="text-rose-300">•</span>
          <span class="text-rose-800 font-medium text-[11px]">
            {rankedItems.length} {isGeneratorView ? 'outage units' : 'affected facilities'} ({rankedItems.reduce((sum, i) => sum + i.unavailableMW, 0).toLocaleString()} MW out)
          </span>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          {/* Fuel Dropdown */}
          <div class="flex items-center gap-1.5">
            <span class="text-slate-500 font-medium text-[11px]">Fuel Type:</span>
            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              class="bg-rose-50/50 border border-rose-200 text-rose-950 rounded px-2 py-0.5 text-[11px] font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
            >
              {FUEL_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div class="flex items-center rounded border border-rose-200 p-0.5 bg-rose-50/80 text-[11px]">
              <button
                onClick={() => onViewModeChange('facility')}
                class={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                  !isGeneratorView
                    ? 'bg-white text-rose-950 font-bold shadow-xs border border-rose-200'
                    : 'text-rose-700 hover:text-rose-950'
                }`}
              >
                <Layers class="w-3 h-3 text-rose-600" />
                <span>Facility View</span>
              </button>
              <button
                onClick={() => onViewModeChange('generator')}
                class={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                  isGeneratorView
                    ? 'bg-white text-rose-950 font-bold shadow-xs border border-rose-200'
                    : 'text-rose-700 hover:text-rose-950'
                }`}
              >
                <Cpu class="w-3 h-3 text-rose-600" />
                <span>Generator View</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Part 1: Top Outage Impacts (Generous Visual Cards) */}
      {rankedItems.length > 0 ? (
        <>
          {topItems.length > 0 && (
            <div>
              <div class="pt-0 pb-1.5 border-b border-rose-200/80 mb-2.5 flex items-baseline justify-between">
                <h3 class="text-xs font-bold text-rose-950 uppercase tracking-tight flex items-center gap-1.5">
                  <span>
                    {isGeneratorView
                      ? `Major ${fuelFilter !== 'all' ? selectedFuelOption.label : ''} Outage Units (≥ ${threshold} MW)`
                      : `Major ${fuelFilter !== 'all' ? selectedFuelOption.label : ''} Outage Facilities (≥ ${threshold} MW)`}
                  </span>
                </h3>
                <span class="text-[11px] text-rose-700 font-medium">
                  {topItems.length} {isGeneratorView ? 'generators' : 'facilities'}
                </span>
              </div>

              <div class="flex flex-wrap items-stretch gap-2.5">
                {topItems.map((item) => {
                  const unavail = item.unavailableMW || 0;
                  const IconComponent = FUEL_ICONS[item.fuelCategory] || Sparkles;

                  const boxWidth = Math.min(185, Math.max(140, Math.round(140 + Math.sqrt(unavail) * 0.45)));
                  const statusStyle = 'bg-rose-50/80 text-rose-900 border-rose-300 hover:bg-rose-100/90 shadow-2xs';
                  const dotBg = 'bg-rose-500';

                  return (
                    <div key={item.id} class="relative group">
                      {/* Outage Card */}
                      <div
                        onClick={() => handleItemClick(item)}
                        style={{ width: `${boxWidth}px` }}
                        class={`rounded-lg border p-2.5 flex flex-col justify-between cursor-pointer select-none transition-transform hover:scale-102 ${statusStyle}`}
                      >
                        {/* Top: Rank + Fuel Icon + Red Dot */}
                        <div class="flex items-center justify-between gap-1 w-full">
                          <span class="text-[10px] font-mono font-bold text-rose-400">
                            #{item.rank}
                          </span>
                          <div class="flex items-center gap-1">
                            <IconComponent class="w-4 h-4 text-rose-700" />
                            <span class={`w-2 h-2 rounded-full ${dotBg}`}></span>
                          </div>
                        </div>

                        {/* Middle: Prominent Unavailable MW */}
                        <div class="my-1.5 font-mono font-bold text-rose-950 tracking-tight">
                          <span class="text-base block leading-none">
                            {unavail.toLocaleString()} MW
                          </span>
                          <span class="text-[9.5px] text-rose-600 font-sans uppercase font-bold block mt-0.5">
                            Unavailable
                          </span>
                        </div>

                        {/* Bottom: Item Name + Outage Context */}
                        <div class="text-xs font-bold text-slate-900 leading-tight tracking-tight truncate" title={item.displayName}>
                          {item.displayName}
                        </div>
                        {isGeneratorView ? (
                          <div class="text-[10px] text-rose-800 font-medium truncate">
                            {item.facilityName}
                          </div>
                        ) : (
                          <div class="text-[10px] text-rose-800 font-medium truncate">
                            {item.outageUnitsCount} {item.outageUnitsCount === 1 ? 'unit out' : 'units out'}
                          </div>
                        )}
                      </div>

                      {/* Hover Tooltip */}
                      <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl whitespace-nowrap min-w-[180px]">
                        <div class="font-bold border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-2">
                          <span>#{item.rank} {item.displayName}</span>
                          <span class="text-[9px] px-1.5 py-0 rounded font-sans uppercase font-bold bg-rose-500/30 text-rose-300">
                            Outage
                          </span>
                        </div>

                        <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                          <div class="flex justify-between">
                            <span class="text-slate-400 font-sans">Fuel Type:</span>
                            <span class="text-slate-200">{item.sectionKey}</span>
                          </div>
                          {isGeneratorView ? (
                            <div class="flex justify-between">
                              <span class="text-slate-400 font-sans">Facility:</span>
                              <span class="text-slate-200">{item.facilityName}</span>
                            </div>
                          ) : (
                            <div class="flex justify-between">
                              <span class="text-slate-400 font-sans">Outage Units:</span>
                              <span class="text-rose-300 font-bold">{item.outageUnitsCount} of {item.totalUnitsCount}</span>
                            </div>
                          )}
                          <div class="flex justify-between border-t border-slate-800 pt-0.5 mt-0.5">
                            <span class="text-slate-400 font-sans">Capacity Out:</span>
                            <span class="text-rose-400 font-bold">{item.unavailableMW.toLocaleString()} MW</span>
                          </div>
                        </div>

                        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Part 2: Additional Outages (Compact Ranked List) */}
          {remainingItems.length > 0 && (
            <div>
              <div class="pt-2 pb-1.5 border-b border-slate-200 mb-2.5 flex items-baseline justify-between">
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  {isGeneratorView
                    ? `Additional Outage Units (under ${threshold} MW)`
                    : `Additional Outage Facilities (under ${threshold} MW)`}
                </h3>
                <span class="text-[11px] text-slate-500 font-medium">
                  {remainingItems.length} {isGeneratorView ? 'generators' : 'facilities'}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5">
                {remainingItems.map((item) => {
                  const unavail = item.unavailableMW || 0;
                  const IconComponent = FUEL_ICONS[item.fuelCategory] || Sparkles;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      class="py-1.5 px-2.5 bg-rose-50/40 hover:bg-rose-100/80 rounded border border-rose-200 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer select-none relative group"
                    >
                      <div class="flex items-center gap-2 min-w-0 flex-1">
                        <span class="text-[10px] font-mono font-bold text-rose-400 w-6 shrink-0">
                          #{item.rank}
                        </span>

                        <div class="min-w-0 truncate">
                          <h4 class="font-bold text-slate-900 truncate tracking-tight leading-tight">
                            {item.displayName}
                          </h4>
                          {isGeneratorView ? (
                            <span class="text-[10px] text-rose-700 block truncate leading-none">
                              {item.facilityName}
                            </span>
                          ) : (
                            <span class="text-[10px] text-rose-700 block truncate leading-none">
                              {item.outageUnitsCount} {item.outageUnitsCount === 1 ? 'unit out' : 'units out'}
                            </span>
                          )}
                        </div>

                        <IconComponent class="w-3.5 h-3.5 text-rose-600 shrink-0 ml-auto" />
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <span class="font-mono font-bold text-rose-900">
                          {unavail.toLocaleString()} MW
                        </span>
                        <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div class="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded border border-slate-200">
          No active outages reported for {selectedFuelOption.label} generation.
        </div>
      )}
    </div>
  );
}
