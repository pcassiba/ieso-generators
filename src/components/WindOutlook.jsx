import React, { useState, useMemo } from 'react';
import { 
  Wind, TrendingUp, TrendingDown, AlertTriangle, Zap, Gauge, 
  Calendar, Layers, Info, MapPin, Activity, Flame, ShieldAlert,
  Compass, RefreshCw, BarChart2
} from 'lucide-react';

const ONTARIO_TOTAL_WIND_CAPACITY = 5500; // MW total installed wind

const REGIONAL_CLUSTERS = [
  { id: 'southwest', name: 'Southwest (Chatham / Lambton / Essex)', lat: 42.4, lon: -82.0, capacity: 2200, locationIdx: 1 },
  { id: 'lake_erie', name: 'Lake Erie & West (Huron / Bruce / Grey)', lat: 43.8, lon: -81.3, capacity: 1650, locationIdx: 0 },
  { id: 'central', name: 'Central Ontario (Dufferin / Simcoe)', lat: 44.0, lon: -80.0, capacity: 660, locationIdx: 2 },
  { id: 'eastern', name: 'Eastern Ontario (Stormont / Dundas)', lat: 44.5, lon: -76.0, capacity: 660, locationIdx: 3 },
  { id: 'northern', name: 'Northern Ontario (Algoma / Prince)', lat: 46.5, lon: -84.0, capacity: 330, locationIdx: 4 }
];

/**
 * IEC Class II/III Turbine S-Curve conversion from 100m wind speed (km/h) to Capacity Factor (0..1)
 * Includes 0.82 fleet availability/loss factor (wake loss, maintenance, array curtailment)
 */
function speedToCapacityFactor(speedKmh) {
  const vMs = speedKmh / 3.6;
  if (vMs <= 3.0) return 0;
  if (vMs >= 25.0) return 0; // Cut-out storm shutdown
  if (vMs >= 13.0) return 0.82; // Rated power with fleet loss factor
  const x = (vMs - 3.0) / (13.0 - 3.0);
  const rawCF = 3 * x * x - 2 * x * x * x;
  return Math.min(0.82, Math.max(0, rawCF * 0.82));
}

const HOUR_MS = 3600 * 1000;
// IESO market time is EST all year (UTC-5)
const EST_OFFSET_MS = 5 * HOUR_MS;

/**
 * UTC ms of the END of an hour -> IESO market date (YYYY-MM-DD) and hour ending (1..24)
 */
function toMarketHour(hourEndMs) {
  const start = new Date(hourEndMs - HOUR_MS - EST_OFFSET_MS);
  return {
    dateStr: start.toISOString().slice(0, 10),
    hourEnding: start.getUTCHours() + 1,
    startHour: start.getUTCHours(),
    startDate: start
  };
}

/**
 * Builds a lookup of UTC ms -> value for one Open-Meteo hourly series (timezone=GMT)
 */
function buildTimeIndex(hourly, key) {
  const map = new Map();
  if (!hourly || !Array.isArray(hourly.time) || !Array.isArray(hourly[key])) return map;
  hourly.time.forEach((t, idx) => {
    const ms = Date.parse(`${t}:00Z`);
    const v = hourly[key][idx];
    if (!isNaN(ms) && typeof v === 'number' && isFinite(v)) map.set(ms, v);
  });
  return map;
}

/**
 * Parses official IESO PUB_VGForecastSummary.xml text for Wind forecast MW
 * Sums Market Participant (Grid) + Embedded wind generators for OntarioTotal
 */
function parseVgXml(xmlText) {
  if (!xmlText) return new Map();
  try {
    const fuelBlocks = xmlText.split('<FuelData>').filter(b => b.includes('<FuelType>Wind</FuelType>'));
    const map = new Map(); // key: 'YYYY-MM-DD-H' -> mw

    fuelBlocks.forEach(fb => {
      const resBlocks = fb.split('<ResourceData>');
      resBlocks.forEach(rb => {
        const zoneMatch = rb.match(/<ZoneName>(.*?)<\/ZoneName>/);
        if (!zoneMatch) return;
        const zone = zoneMatch[1].trim().toUpperCase();

        if (zone === 'ONTARIOTOTAL') {
          const efs = rb.split('<EnergyForecast>').slice(1);
          efs.forEach(ef => {
            const dateStr = ef.match(/<ForecastDate>(.*?)<\/ForecastDate>/)?.[1];
            const intervals = Array.from(ef.matchAll(/<ForecastHour>(.*?)<\/ForecastHour>[\s\S]*?<MWOutput>(.*?)<\/MWOutput>/g));
            intervals.forEach(inv => {
              const hour = parseInt(inv[1], 10);
              const mw = parseFloat(inv[2]);
              if (dateStr && !isNaN(hour)) {
                const key = `${dateStr}-${hour}`;
                map.set(key, (map.get(key) || 0) + mw);
              }
            });
          });
        }
      });
    });

    return map;
  } catch (err) {
    console.warn('Failed to parse IESO VG Forecast XML:', err);
    return new Map();
  }
}

/**
 * Classification badge configuration
 */
function getWindClassification(cfPercent) {
  if (cfPercent < 15) {
    return { label: 'Very Low', color: 'bg-rose-100 text-rose-800 border-rose-200', barColor: 'bg-rose-500', desc: 'Minimal wind generation' };
  } else if (cfPercent < 30) {
    return { label: 'Low', color: 'bg-amber-100 text-amber-800 border-amber-200', barColor: 'bg-amber-500', desc: 'Below average wind' };
  } else if (cfPercent < 50) {
    return { label: 'Moderate', color: 'bg-blue-100 text-blue-800 border-blue-200', barColor: 'bg-blue-500', desc: 'Typical wind dispatch' };
  } else if (cfPercent < 70) {
    return { label: 'High', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', barColor: 'bg-emerald-500', desc: 'Strong wind output' };
  } else {
    return { label: 'Very High', color: 'bg-purple-100 text-purple-800 border-purple-200', barColor: 'bg-purple-600', desc: 'Near-peak wind production' };
  }
}

export default function WindOutlook({ data, vgXmlText, weatherData, sourceStatus = {}, onRefresh }) {
  const [showIeso, setShowIeso] = useState(true);
  const [showEcmwf, setShowEcmwf] = useState(true);
  const [showGfs, setShowGfs] = useState(true);
  const [showUncertainty, setShowUncertainty] = useState(true);
  const [hoveredHourIndex, setHoveredHourIndex] = useState(null);

  const iesoMap = useMemo(() => parseVgXml(vgXmlText), [vgXmlText]);

  // Per-cluster lookups of real model values keyed by UTC time. Empty when the fetch failed.
  const weatherIndex = useMemo(() => {
    if (!Array.isArray(weatherData) || weatherData.length < REGIONAL_CLUSTERS.length) return null;
    const idx = REGIONAL_CLUSTERS.map(cluster => {
      const hourly = weatherData[cluster.locationIdx]?.hourly;
      return {
        ecmwf: buildTimeIndex(hourly, 'wind_speed_100m_ecmwf_ifs025'),
        gfs: buildTimeIndex(hourly, 'wind_speed_100m_gfs_seamless')
      };
    });
    const hasAny = idx.some(c => c.ecmwf.size > 0 || c.gfs.size > 0);
    return hasAny ? idx : null;
  }, [weatherData]);

  // What failed to load. Nothing is ever filled in for a missing source.
  const iesoLoaded = iesoMap.size > 0;
  const weatherLoaded = weatherIndex !== null;
  const iesoFailed = !iesoLoaded && sourceStatus.ieso !== 'loading';
  const weatherFailed = !weatherLoaded && sourceStatus.weather !== 'loading';

  // 1. Process 168-Hour Time Series Data (Combining IESO 48h + ECMWF + GFS)
  //    Hour 0 is the hour in progress right now (not midnight), in IESO market time (EST).
  const forecastSeries = useMemo(() => {
    const hours = [];
    const firstHourEndMs = Math.floor(Date.now() / HOUR_MS) * HOUR_MS + HOUR_MS;

    for (let i = 0; i < 168; i++) {
      const hourEndMs = firstHourEndMs + i * HOUR_MS;
      const { dateStr, hourEnding, startHour, startDate } = toMarketHour(hourEndMs);
      const hourNum = hourEnding;
      const dayName = startDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const monthDay = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      const timeStr = `${String(startHour).padStart(2, '0')}:00`;

      // 1. Weather model MW across 5 clusters. A model total exists only when every
      //    cluster has a real value for this hour; otherwise it is left empty (null).
      let ecmwfMW = weatherIndex ? 0 : null;
      let gfsMW = weatherIndex ? 0 : null;
      const clusterDetails = [];

      REGIONAL_CLUSTERS.forEach((cluster, cIdx) => {
        // Model value valid at the end of the hour (hour-ending, like IESO)
        const ecmwfSpeed = weatherIndex ? (weatherIndex[cIdx].ecmwf.get(hourEndMs) ?? null) : null;
        const gfsSpeed = weatherIndex ? (weatherIndex[cIdx].gfs.get(hourEndMs) ?? null) : null;

        const cEcmwfMW = ecmwfSpeed !== null ? cluster.capacity * speedToCapacityFactor(ecmwfSpeed) : null;
        const cGfsMW = gfsSpeed !== null ? cluster.capacity * speedToCapacityFactor(gfsSpeed) : null;

        ecmwfMW = (ecmwfMW === null || cEcmwfMW === null) ? null : ecmwfMW + cEcmwfMW;
        gfsMW = (gfsMW === null || cGfsMW === null) ? null : gfsMW + cGfsMW;

        clusterDetails.push({
          id: cluster.id,
          name: cluster.name,
          capacity: cluster.capacity,
          ecmwfSpeed,
          gfsSpeed,
          ecmwfMW: cEcmwfMW,
          gfsMW: cGfsMW,
          cf: ecmwfSpeed !== null ? speedToCapacityFactor(ecmwfSpeed) * 100 : null
        });
      });

      // 2. Official IESO Forecast Point lookup
      const iesoMW = iesoMap.get(`${dateStr}-${hourNum}`) ?? null;

      // 3. Blended Forecast: IESO first, ECMWF beyond. Null when neither is available.
      let blendedMW = null;
      if (iesoMW !== null && ecmwfMW !== null && i >= 36 && i < 48) {
        const ratio = (48 - i) / 12;
        blendedMW = ratio * iesoMW + (1 - ratio) * ecmwfMW;
      } else if (iesoMW !== null && (i < 48 || ecmwfMW === null)) {
        blendedMW = iesoMW;
      } else if (ecmwfMW !== null) {
        blendedMW = ecmwfMW;
      }

      // 4. Uncertainty range (min/max of the models that actually have a value)
      const available = [iesoMW, ecmwfMW, gfsMW].filter(v => v !== null);
      const minMW = available.length >= 2 ? Math.min(...available) : null;
      const maxMW = available.length >= 2 ? Math.max(...available) : null;

      hours.push({
        index: i,
        timestamp: new Date(hourEndMs - HOUR_MS),
        dateStr,
        dayName,
        monthDay,
        timeStr,
        hourNum,
        iesoMW,
        ecmwfMW,
        gfsMW,
        blendedMW,
        minMW,
        maxMW,
        capacityFactor: blendedMW !== null ? (blendedMW / ONTARIO_TOTAL_WIND_CAPACITY) * 100 : null,
        clusters: clusterDetails
      });
    }

    return hours;
  }, [iesoMap, weatherIndex]);

  // 2. Daily Summary Aggregates (Exactly 7 Calendar Cards)
  const dailySummaries = useMemo(() => {
    const daysMap = new Map();

    forecastSeries.forEach(h => {
      if (h.blendedMW === null) return;
      if (!daysMap.has(h.dateStr)) {
        daysMap.set(h.dateStr, {
          dateStr: h.dateStr,
          dayName: h.dayName,
          monthDay: h.monthDay,
          firstHourIdx: h.index,
          hours: []
        });
      }
      daysMap.get(h.dateStr).hours.push(h);
    });

    const summaries = [];
    let idx = 0;
    daysMap.forEach((dayData, dateStr) => {
      const hours = dayData.hours;
      const avgMW = hours.reduce((acc, h) => acc + h.blendedMW, 0) / hours.length;
      const maxMW = Math.max(...hours.map(h => h.blendedMW));
      const minMW = Math.min(...hours.map(h => h.blendedMW));
      const avgCF = (avgMW / ONTARIO_TOTAL_WIND_CAPACITY) * 100;
      const classification = getWindClassification(avgCF);

      const titleName = dateStr === forecastSeries[0]?.dateStr ? 'Today' : dayData.dayName;

      summaries.push({
        dateStr,
        dayName: titleName,
        monthDay: dayData.monthDay,
        firstHourIdx: dayData.firstHourIdx,
        hoursCount: hours.length,
        avgMW: Math.round(avgMW),
        maxMW: Math.round(maxMW),
        minMW: Math.round(minMW),
        avgCF: Math.round(avgCF),
        classification
      });
      idx++;
    });

    // Exactly 7 calendar cards
    return summaries.slice(0, 7);
  }, [forecastSeries]);

  // 3. Wind Ramp Detection Analytics (3h & 6h Ramps)
  const rampEvents = useMemo(() => {
    const events = [];

    for (let i = 0; i < forecastSeries.length - 6; i++) {
      const hStart = forecastSeries[i];
      const h3 = forecastSeries[i + 3];
      const h6 = forecastSeries[i + 6];
      if (hStart.blendedMW === null || h3.blendedMW === null || h6.blendedMW === null) continue;

      const delta3h = h3.blendedMW - hStart.blendedMW;
      const delta6h = h6.blendedMW - hStart.blendedMW;

      if (Math.abs(delta3h) >= 500 || Math.abs(delta6h) >= 1000) {
        const isUp = delta3h > 0 || delta6h > 0;
        const mainDelta = Math.abs(delta3h) >= 500 ? delta3h : delta6h;
        const hoursSpan = Math.abs(delta3h) >= 500 ? 3 : 6;
        const ratePerHour = Math.round(mainDelta / hoursSpan);

        events.push({
          startIndex: i,
          startTimeStr: `${hStart.dayName} ${hStart.timeStr}`,
          endTimeStr: `${(hoursSpan === 3 ? h3 : h6).dayName} ${(hoursSpan === 3 ? h3 : h6).timeStr}`,
          hoursSpan,
          isUp,
          deltaMW: Math.round(mainDelta),
          ratePerHour,
          startMW: Math.round(hStart.blendedMW),
          endMW: Math.round((hoursSpan === 3 ? h3 : h6).blendedMW),
          severity: Math.abs(mainDelta) >= 1200 ? 'High' : 'Moderate'
        });

        i += 2;
      }
    }

    return events.slice(0, 6);
  }, [forecastSeries]);

  // Overall 7-Day Stats
  const weekStats = useMemo(() => {
    const blendedList = forecastSeries.map(h => h.blendedMW).filter(v => v !== null);
    if (!blendedList.length) return null;
    const maxMW = Math.round(Math.max(...blendedList));
    const minMW = Math.round(Math.min(...blendedList));
    const avgMW = Math.round(blendedList.reduce((a, b) => a + b, 0) / blendedList.length);
    const avgCF = Math.round((avgMW / ONTARIO_TOTAL_WIND_CAPACITY) * 100);
    const hoursCovered = blendedList.length;
    const totalEnergyGWh = Math.round((avgMW * hoursCovered) / 1000);

    return { maxMW, minMW, avgMW, avgCF, totalEnergyGWh, hoursCovered };
  }, [forecastSeries]);

  // SVG Chart Dimensions
  const chartWidth = 900;
  const chartHeight = 280;
  const paddingLeft = 45;
  const paddingBottom = 30;
  const paddingTop = 15;
  const paddingRight = 20;

  const innerW = chartWidth - paddingLeft - paddingRight;
  const innerH = chartHeight - paddingTop - paddingBottom;
  const maxY = 5500; // Total wind capacity

  const getX = (idx) => paddingLeft + (idx / 167) * innerW;
  const getY = (mw) => paddingTop + innerH - (Math.min(maxY, Math.max(0, mw)) / maxY) * innerH;

  // Render SVG Paths
  const buildPath = (key) => {
    let prevMissing = true;
    return forecastSeries.reduce((acc, pt, i) => {
      const val = pt[key];
      if (val === null || val === undefined) { prevMissing = true; return acc; }
      const x = getX(i);
      const y = getY(val);
      const cmd = prevMissing ? `${acc ? ' ' : ''}M ${x} ${y}` : ` L ${x} ${y}`;
      prevMissing = false;
      return acc + cmd;
    }, '');
  };

  const iesoPath = buildPath('iesoMW');
  const ecmwfPath = buildPath('ecmwfMW');
  const gfsPath = buildPath('gfsMW');

  // SVG Polygon for uncertainty area
  const uncertaintyArea = useMemo(() => {
    // One closed shape per run of hours that have at least two real forecasts
    const shapes = [];
    let top = '';
    let bottom = '';
    const flush = () => {
      if (top) shapes.push(top + bottom + ' Z');
      top = '';
      bottom = '';
    };

    forecastSeries.forEach((pt, i) => {
      if (pt.minMW === null || pt.maxMW === null) { flush(); return; }
      const x = getX(i);
      const yMax = getY(pt.maxMW);
      const yMin = getY(pt.minMW);
      top += (top === '' ? `M ${x} ${yMax}` : ` L ${x} ${yMax}`);
      bottom = ` L ${x} ${yMin}` + bottom;
    });
    flush();

    return shapes.join(' ');
  }, [forecastSeries]);

  const currentHoveredPoint = hoveredHourIndex !== null ? forecastSeries[hoveredHourIndex] : null;
  const fmtMW = (v) => (v === null || v === undefined) ? 'Not loaded' : `${Math.round(v).toLocaleString()} MW`;

  // Plain-language notices for anything that did not load
  const loadNotices = [];
  if (iesoFailed) {
    loadNotices.push('The official IESO wind forecast (PUB_VGForecastSummary) did not load, so the IESO line and its 48-hour numbers are not shown.');
  }
  if (weatherFailed) {
    loadNotices.push('The ECMWF and GFS weather forecasts (Open-Meteo) did not load, so the weather model lines, days 3 to 7 and the regional breakdown are not shown.');
  }
  const nothingLoaded = !iesoLoaded && !weatherLoaded;

  return (
    <div className="space-y-4 text-slate-800">
      {/* Data load notice: shown instead of filling gaps with made-up numbers */}
      {loadNotices.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-lg p-3 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Some wind forecast data did not load</p>
              {loadNotices.map((msg, i) => <p key={i}>{msg}</p>)}
              <p className="text-rose-700">Only data that actually loaded is shown below. Nothing is estimated in its place.</p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded font-medium text-[11px] shrink-0"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* 1. Header Banner & Quick Metrics */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Ontario Wind 7-Day Generation Outlook</h2>
              <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                Official IESO + ECMWF/GFS Weather Models
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Combines official IESO 48h Variable Generation Forecast with ECMWF & GFS numerical wind weather models for a 168-hour outlook across 5 Ontario wind clusters.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Forecast</span>
              </button>
            )}
          </div>
        </div>

        {/* Headline Quick Stats Strip */}
        {weekStats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">
                {weekStats.hoursCovered >= 168 ? '7-Day Avg Output' : `Avg Output (next ${weekStats.hoursCovered} h)`}
              </span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {weekStats.avgMW.toLocaleString()} <span className="text-xs font-normal text-slate-500">MW</span>
              </div>
              <span className="text-[10px] text-slate-500">{weekStats.avgCF}% Avg Capacity Factor</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">Peak Expected Wind</span>
              <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                {weekStats.maxMW.toLocaleString()} <span className="text-xs font-normal text-slate-500">MW</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">
                {Math.round((weekStats.maxMW / ONTARIO_TOTAL_WIND_CAPACITY) * 100)}% Max Fleet CF
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">Minimum Wind MW</span>
              <div className="text-base font-extrabold text-rose-700 mt-0.5">
                {weekStats.minMW.toLocaleString()} <span className="text-xs font-normal text-slate-500">MW</span>
              </div>
              <span className="text-[10px] text-rose-600 font-medium">Lowest hour in the outlook</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">
                {weekStats.hoursCovered >= 168 ? '7-Day Wind Generation' : `Wind Generation (next ${weekStats.hoursCovered} h)`}
              </span>
              <div className="text-base font-extrabold text-blue-700 mt-0.5">
                {weekStats.totalEnergyGWh.toLocaleString()} <span className="text-xs font-normal text-slate-500">GWh</span>
              </div>
              <span className="text-[10px] text-blue-600">Zero-emission power</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 font-medium block">Wind Fleet Capacity</span>
              <div className="text-base font-extrabold text-slate-800 mt-0.5">
                5,500 <span className="text-xs font-normal text-slate-500">MW</span>
              </div>
              <span className="text-[10px] text-slate-500">~95 Ontario wind farms</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Daily Summary Cards Strip (Exactly 7 Calendar Cards) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>7-Day Daily Wind Forecast Summary</span>
          </h3>
          <span className="text-[11px] text-slate-400">Capacity Factor & Dispatch Classification</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {dailySummaries.map((day, idx) => (
            <div 
              key={day.dateStr} 
              className={`p-2.5 rounded-lg border text-center transition-all ${
                idx === 0 ? 'bg-blue-50/50 border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold text-slate-800">{day.dayName}</div>
              <div className="text-[10px] text-slate-500 mb-1.5">{day.monthDay}</div>

              {/* Classification Badge */}
              <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border mb-2 inline-block ${day.classification.color}`}>
                {day.classification.label}
              </div>

              {/* Average MW */}
              <div className="text-sm font-extrabold text-slate-900">{day.avgMW.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">MW</span></div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {day.minMW} - {day.maxMW} MW
              </div>

              {/* Mini CF Progress Bar */}
              <div className="mt-2 pt-1.5 border-t border-slate-200/60">
                <div className="flex justify-between text-[10px] text-slate-600 mb-0.5 font-medium">
                  <span>CF:</span>
                  <span className="font-bold">{day.avgCF}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${day.classification.barColor}`} 
                    style={{ width: `${Math.min(100, day.avgCF)}%` }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Main Chart Controls & SVG Interactive Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              168-Hour Wind Generation & Forecast Trajectory
            </h3>
          </div>

          {/* Forecast Layer Toggle Checkboxes */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
              <input 
                type="checkbox" 
                checked={showIeso} 
                onChange={(e) => setShowIeso(e.target.checked)} 
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="inline-block w-2.5 h-0.5 bg-blue-600 rounded"></span>
              <span>IESO Official (48h)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
              <input 
                type="checkbox" 
                checked={showEcmwf} 
                onChange={(e) => setShowEcmwf(e.target.checked)} 
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="inline-block w-2.5 h-0.5 bg-emerald-600 rounded"></span>
              <span>ECMWF Weather</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
              <input 
                type="checkbox" 
                checked={showGfs} 
                onChange={(e) => setShowGfs(e.target.checked)} 
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span className="inline-block w-2.5 h-0.5 bg-amber-500 rounded"></span>
              <span>GFS Weather</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
              <input 
                type="checkbox" 
                checked={showUncertainty} 
                onChange={(e) => setShowUncertainty(e.target.checked)} 
                className="rounded text-slate-400 focus:ring-slate-400"
              />
              <span className="inline-block w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 rounded-xs"></span>
              <span>Ensemble Band</span>
            </label>
          </div>
        </div>

        {/* SVG Time-Series Chart Canvas */}
        <div className="relative w-full overflow-x-auto">
          {nothingLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 border border-rose-200 text-rose-800 text-xs font-medium px-3 py-2 rounded">
                No wind forecast data loaded. Nothing to chart.
              </div>
            </div>
          )}
          <div className="min-w-[700px]">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-auto overflow-visible select-none"
              onMouseLeave={() => setHoveredHourIndex(null)}
            >
              {/* Background Grid Lines & Y-Axis Labels */}
              {[0, 1000, 2000, 3000, 4000, 5000].map(mw => {
                const y = getY(mw);
                return (
                  <g key={mw}>
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={chartWidth - paddingRight} 
                      y2={y} 
                      stroke="#f1f5f9" 
                      strokeDasharray="3 3" 
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={y + 3} 
                      textAnchor="end" 
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {mw}
                    </text>
                  </g>
                );
              })}

              {/* Day Divider Vertical Lines & Date Labels (Placed at Midnight) */}
              {dailySummaries.map((day, idx) => {
                const x = getX(day.firstHourIdx);
                const next = dailySummaries[idx + 1];
                const showLabel = !next || next.firstHourIdx - day.firstHourIdx >= 10;
                return (
                  <g key={day.dateStr}>
                    <line 
                      x1={x} 
                      y1={paddingTop} 
                      x2={x} 
                      y2={paddingTop + innerH} 
                      stroke="#e2e8f0" 
                      strokeWidth={idx === 0 ? "1.5" : "1"} 
                    />
                    {showLabel && (
                      <text 
                        x={x + 6} 
                        y={paddingTop + 12} 
                        className="text-[10px] font-bold fill-slate-500"
                      >
                        {day.dayName} ({day.monthDay})
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 1. Uncertainty Ensemble Band Polygon */}
              {showUncertainty && (
                <path 
                  d={uncertaintyArea} 
                  fill="url(#uncertaintyGrad)" 
                  opacity="0.3" 
                />
              )}

              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="uncertaintyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* 2. GFS Model Line (Amber Dashed) */}
              {showGfs && (
                <path 
                  d={gfsPath} 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 3" 
                  opacity="0.85" 
                />
              )}

              {/* 3. ECMWF Model Line (Emerald Solid) */}
              {showEcmwf && (
                <path 
                  d={ecmwfPath} 
                  fill="none" 
                  stroke="#059669" 
                  strokeWidth="2" 
                />
              )}

              {/* 4. Official IESO Forecast Line (Blue Bold Line with Dots for 48h) */}
              {showIeso && iesoPath && (
                <path 
                  d={iesoPath} 
                  fill="none" 
                  stroke="#2563eb" 
                  strokeWidth="2.5" 
                />
              )}

              {/* 48-Hour Official Boundary Line */}
              <line 
                x1={getX(48)} 
                y1={paddingTop} 
                x2={getX(48)} 
                y2={paddingTop + innerH} 
                stroke="#2563eb" 
                strokeWidth="1" 
                strokeDasharray="4 2" 
              />
              <text 
                x={getX(48) + 4} 
                y={paddingTop + innerH - 6} 
                className="text-[9px] font-bold fill-blue-600"
              >
                48h IESO Official Horizon
              </text>

              {/* Hover Crosshair & Interactive Rectangles */}
              {forecastSeries.map((pt, i) => {
                const x = getX(i);
                return (
                  <rect 
                    key={i} 
                    x={x - (innerW / 168) / 2} 
                    y={paddingTop} 
                    width={innerW / 168} 
                    height={innerH} 
                    fill="transparent" 
                    className="cursor-crosshair" 
                    onMouseEnter={() => setHoveredHourIndex(i)} 
                  />
                );
              })}

              {/* Active Hover Marker */}
              {currentHoveredPoint && (
                <g>
                  <line 
                    x1={getX(currentHoveredPoint.index)} 
                    y1={paddingTop} 
                    x2={getX(currentHoveredPoint.index)} 
                    y2={paddingTop + innerH} 
                    stroke="#475569" 
                    strokeWidth="1" 
                    strokeDasharray="2 2" 
                  />
                  {currentHoveredPoint.blendedMW !== null && (
                    <circle 
                      cx={getX(currentHoveredPoint.index)} 
                      cy={getY(currentHoveredPoint.blendedMW)} 
                      r="4" 
                      fill="#2563eb" 
                      stroke="#ffffff" 
                      strokeWidth="2" 
                    />
                  )}
                </g>
              )}
            </svg>
          </div>

          {/* Hover Tooltip Overlay */}
          {currentHoveredPoint && (
            <div className="absolute top-2 right-4 bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-lg text-xs shadow-lg space-y-1.5 border border-slate-700 pointer-events-none z-10">
              <div className="font-bold border-b border-slate-700 pb-1 flex items-center justify-between gap-4 text-blue-300">
                <span>{currentHoveredPoint.dayName}, {currentHoveredPoint.monthDay} {currentHoveredPoint.timeStr}</span>
                <span className="text-[10px] text-slate-400">Hour {currentHoveredPoint.index + 1} of 168</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5">
                <div>
                  <span className="text-slate-400">Blended MW:</span>{' '}
                  <span className="font-extrabold text-emerald-400">{fmtMW(currentHoveredPoint.blendedMW)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Capacity Factor:</span>{' '}
                  <span className="font-bold text-amber-300">{currentHoveredPoint.capacityFactor === null ? 'Not loaded' : `${Math.round(currentHoveredPoint.capacityFactor)}%`}</span>
                </div>
                {currentHoveredPoint.iesoMW !== null && (
                  <div>
                    <span className="text-slate-400">IESO Official:</span>{' '}
                    <span className="font-bold text-blue-400">{Math.round(currentHoveredPoint.iesoMW).toLocaleString()} MW</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">ECMWF Weather:</span>{' '}
                  <span className="font-bold text-emerald-300">{fmtMW(currentHoveredPoint.ecmwfMW)}</span>
                </div>
                <div>
                  <span className="text-slate-400">GFS Weather:</span>{' '}
                  <span className="font-bold text-amber-400">{fmtMW(currentHoveredPoint.gfsMW)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Model Spread:</span>{' '}
                  <span className="font-bold text-purple-300">{currentHoveredPoint.maxMW === null ? 'n/a' : `±${Math.round((currentHoveredPoint.maxMW - currentHoveredPoint.minMW) / 2)} MW`}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Wind Ramp Monitor & Market Impact Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ramp Monitor Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Wind Ramp Monitor (3h / 6h Ramps)</span>
              </h3>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200">
                Threshold: ±500 MW/3h
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Detects rapid wind ramps across Ontario that require thermal gas peakers or hydro dispatch response.
            </p>

            {rampEvents.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
                {weekStats
                  ? `No major wind ramps exceeding ±500 MW/3h detected in the next ${weekStats.hoursCovered} hours.`
                  : 'No forecast data loaded, so ramps cannot be checked.'}
              </div>
            ) : (
              <div className="space-y-2">
                {rampEvents.map((evt, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded border flex items-center justify-between text-xs ${
                      evt.isUp 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-full ${evt.isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {evt.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{evt.isUp ? 'Up-Ramp' : 'Down-Ramp'}: {evt.deltaMW > 0 ? `+${evt.deltaMW}` : evt.deltaMW} MW</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            evt.severity === 'High' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                          }`}>
                            {evt.severity}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {evt.startTimeStr} → {evt.endTimeStr} ({evt.hoursSpan} hours)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-800">
                        {evt.ratePerHour > 0 ? `+${evt.ratePerHour}` : evt.ratePerHour} MW/h
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {evt.startMW} → {evt.endMW} MW
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Market Impact & Thermal Gas Dispatch Pressure */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Market Impact & Gas Dispatch Pressure</span>
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                Rule-Based Grid Analytics
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Card 1: Gas Thermal Displacement */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Flame className="w-3.5 h-3.5 text-orange-600" />
                  <span>Gas Dispatch & Thermal Requirement</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {!weekStats ? (
                    <span className="text-slate-500">No forecast data loaded.</span>
                  ) : weekStats.avgCF > 40 ? (
                    <span className="text-emerald-700 font-semibold">
                      Strong average wind output ({weekStats.avgCF}% CF) will suppress gas thermal dispatch and lower peak HOEP spot price volatility across Ontario.
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">
                      Moderate-to-low wind generation ({weekStats.avgCF}% CF) will increase reliance on natural gas thermal peakers (Napanee, Halton Hills, Greenfield Energy) during peak demand periods.
                    </span>
                  )}
                </p>
              </div>

              {/* Card 2: Surplus Baseload Generation (SBG) & Negative Price Warning */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                  <span>Surplus Baseload Generation (SBG) Risk</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Overnight hours with wind output exceeding <strong className="text-purple-700">3,500 MW</strong> may trigger IESO SBG procedures, resulting in wind curtailment or nuclear maneuvering at Bruce Power and Darlington.
                </p>
              </div>

              {/* Card 3: Flexible Ramping Advisory */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>Operating Reserve & Flexibility</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Hydro-electric flexible storage (Niagara, Beck, Saunders) and battery storage assets will provide primary fast-response frequency regulation during steep wind transitions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Regional Wind Cluster Breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Regional Wind Cluster Forecast Breakdown (5 Ontario Regions)</span>
          </h3>
          <span className="text-[11px] text-slate-500">100m Hub Height Wind Speed & Power Curve</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {REGIONAL_CLUSTERS.map(cluster => {
            const samplePoint = forecastSeries[0]?.clusters.find(c => c.id === cluster.id);
            const hasSample = samplePoint && samplePoint.ecmwfSpeed !== null;
            const speedKmh = hasSample ? Math.round(samplePoint.ecmwfSpeed) : null;
            const speedMs = hasSample ? (samplePoint.ecmwfSpeed / 3.6).toFixed(1) : null;
            const cfPercent = hasSample ? Math.round(samplePoint.cf) : null;
            const currentMw = hasSample ? Math.round(samplePoint.ecmwfMW) : null;
            const classification = hasSample ? getWindClassification(cfPercent) : null;

            return (
              <div key={cluster.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="font-bold text-xs text-slate-900">{cluster.name}</div>
                  <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>

                <div className="text-[11px] text-slate-500">
                  Capacity: <strong className="text-slate-800">{cluster.capacity.toLocaleString()} MW</strong>
                </div>

                <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">100m Wind Speed:</span>
                    <span className="font-mono font-bold text-slate-800">{hasSample ? `${speedKmh} km/h (${speedMs} m/s)` : 'Not loaded'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Expected Output:</span>
                    <span className="font-bold text-emerald-700">{hasSample ? `${currentMw} MW` : 'Not loaded'}</span>
                  </div>
                </div>

                {/* Regional Progress */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-600 mb-1 font-medium">
                    <span>Capacity Factor</span>
                    <span>{hasSample ? `${cfPercent}%` : 'Not loaded'}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    {hasSample && (
                      <div 
                        className={`h-full ${classification.barColor}`} 
                        style={{ width: `${Math.min(100, cfPercent)}%` }} 
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Explanatory Note */}
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-lg p-3 text-xs text-blue-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed text-[11px]">
          <p className="font-semibold text-blue-900">How to read the Wind Outlook:</p>
          <p>
            The official IESO 48-Hour Variable Generation Forecast is retrieved directly from <code className="bg-blue-100/80 px-1 py-0.5 rounded text-blue-900 font-mono">PUB_VGForecastSummary.xml</code> (combining Grid Market Participant + Embedded wind generators). 
            For days 3 through 7, numerical weather prediction model wind speeds at 100m turbine hub height (ECMWF IFS & GFS) are retrieved via Open-Meteo and converted to electrical generation MW using an IEC Class II/III power curve aggregated across Ontario's 5 major wind clusters.
          </p>
        </div>
      </div>
    </div>
  );
}
