import React from 'react';
import { Atom, Flame, Waves, Wind, BatteryCharging, Sparkles, Layers, Cpu } from 'lucide-react';
import { SECTION_KEYS, formatHoH } from '../utils/iesoParser';

const FUEL_ICONS = {
  'NUCLEAR': Atom,
  'GAS': Flame,
  'HYDRO': Waves,
  'WIND': Wind,
  'BATTERIES': BatteryCharging,
  'OTHER': Sparkles
};

export default function Visualization({ data, viewMode = 'facility', onViewModeChange, onSelectFacility, onSelectGenerator }) {
  if (!data || !data.sections) return null;

  const handleItemClick = (item) => {
    if (viewMode === 'generator') {
      if (onSelectGenerator) onSelectGenerator(item.displayName);
    } else {
      if (onSelectFacility) onSelectFacility(item.displayName);
    }
  };

  const isGeneratorView = viewMode === 'generator';
  const allItems = [];

  data.sections.forEach(section => {
    let sectionFuelKey = section.key;
    if (sectionFuelKey === SECTION_KEYS.NUCLEAR) sectionFuelKey = 'NUCLEAR';
    else if (sectionFuelKey === SECTION_KEYS.GAS) sectionFuelKey = 'GAS';
    else if (sectionFuelKey === SECTION_KEYS.HYDRO) sectionFuelKey = 'HYDRO';
    else if (sectionFuelKey === SECTION_KEYS.WIND) sectionFuelKey = 'WIND';
    else if (sectionFuelKey === SECTION_KEYS.BATTERIES) sectionFuelKey = 'BATTERIES';
    else sectionFuelKey = 'OTHER';

    (section.facilities || []).forEach(fac => {
      if (isGeneratorView) {
        // Collect individual generator units
        (fac.units || []).forEach(unit => {
          let status = 'outage';
          let statusLabel = 'Outage';
          if (unit.outputMW > 0) {
            status = 'generating';
            statusLabel = 'Generating';
          } else if (unit.capabilityMW > 0 || unit.availMW > 0) {
            status = 'idle';
            statusLabel = 'Idle';
          }

          allItems.push({
            id: unit.genName,
            displayName: unit.genName,
            facilityName: fac.name,
            fuelCategory: sectionFuelKey,
            sectionKey: section.key,
            outputMW: unit.outputMW || 0,
            prevOutputMW: unit.prevOutputMW,
            mwChange: unit.mwChange || 0,
            pctChange: unit.pctChange || 0,
            capabilityMW: unit.capabilityMW || 0,
            status,
            statusLabel,
            utilization: unit.capabilityMW > 0 ? (unit.outputMW / unit.capabilityMW) * 100 : 0
          });
        });
      } else {
        // Collect aggregated facilities
        let status = 'outage';
        let statusLabel = 'Outage';
        if (fac.totalOutputMW > 0) {
          status = 'generating';
          statusLabel = 'Generating';
        } else if (fac.totalCapabilityMW > 0) {
          status = 'idle';
          statusLabel = 'Idle';
        }

        allItems.push({
          id: fac.name,
          displayName: fac.name,
          facilityName: fac.name,
          fuelCategory: sectionFuelKey,
          sectionKey: section.key,
          outputMW: fac.totalOutputMW || 0,
          prevOutputMW: fac.totalPrevOutputMW,
          mwChange: fac.totalMwChange || 0,
          pctChange: fac.totalPctChange || 0,
          capabilityMW: fac.totalCapabilityMW || 0,
          status,
          statusLabel,
          utilization: fac.totalCapabilityMW > 0 ? (fac.totalOutputMW / fac.totalCapabilityMW) * 100 : 0
        });
      }
    });
  });

  // Sort strictly by current output MW descending
  allItems.sort((a, b) => {
    if (b.outputMW !== a.outputMW) {
      return b.outputMW - a.outputMW;
    }
    return b.capabilityMW - a.capabilityMW;
  });

  // Assign rank numbers
  const rankedItems = allItems.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));

  const threshold = isGeneratorView ? 40 : 80;
  const topItems = rankedItems.filter(item => item.outputMW >= threshold);
  const remainingItems = rankedItems.filter(item => item.outputMW < threshold);

  return (
    <div class="space-y-4 pt-0.5">
      {/* View Switcher Controls Header inside Visualization */}
      <div class="flex items-center justify-between gap-2 pb-1 border-b border-slate-200 text-xs">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-900 uppercase tracking-tight">
            {isGeneratorView ? 'Generator / Unit Output Ranking' : 'Facility Output Ranking'}
          </span>
          <span class="text-slate-300">•</span>
          <span class="text-slate-500 font-medium">
            {rankedItems.length} {isGeneratorView ? 'generators' : 'facilities'} total
          </span>
        </div>

        {onViewModeChange && (
          <div class="flex items-center rounded border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
            <button
              onClick={() => onViewModeChange('facility')}
              class={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                !isGeneratorView
                  ? 'bg-white text-blue-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers class="w-3 h-3 text-blue-600" />
              <span>Facility</span>
            </button>
            <button
              onClick={() => onViewModeChange('generator')}
              class={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                isGeneratorView
                  ? 'bg-white text-purple-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu class="w-3 h-3 text-purple-600" />
              <span>Generator</span>
            </button>
          </div>
        )}
      </div>

      {/* Part 1: Top Output Items (Generous Visual Cards) */}
      <div>
        <div class="pt-0 pb-1.5 border-b border-slate-200 mb-2.5 flex items-baseline justify-between">
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-tight">
            {isGeneratorView ? `Top Generating Units (≥ ${threshold} MW)` : `Top Generating Facilities (≥ ${threshold} MW)`}
          </h3>
          <span class="text-[11px] text-slate-500 font-medium">
            {topItems.length} {isGeneratorView ? 'generators' : 'facilities'}
          </span>
        </div>

        <div class="flex flex-wrap items-stretch gap-2.5">
          {topItems.map((item) => {
            const output = item.outputMW || 0;
            const IconComponent = FUEL_ICONS[item.fuelCategory] || Sparkles;
            const hohStrCompact = formatHoH(item.mwChange, item.pctChange, true);
            const hohStrFull = formatHoH(item.mwChange, item.pctChange, false);

            const boxWidth = Math.min(175, Math.max(135, Math.round(135 + Math.sqrt(output) * 0.45)));

            let statusStyle = 'bg-emerald-50/70 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-2xs';
            let dotBg = 'bg-emerald-500';

            if (item.status === 'idle') {
              statusStyle = 'bg-amber-50/70 text-amber-700 border-amber-300 hover:bg-amber-100 shadow-2xs';
              dotBg = 'bg-amber-400';
            } else if (item.status === 'outage') {
              statusStyle = 'bg-rose-50/70 text-rose-700 border-rose-300 hover:bg-rose-100 shadow-2xs';
              dotBg = 'bg-rose-500';
            }

            return (
              <div key={item.id} class="relative group">
                {/* Generous Visual Card */}
                <div
                  onClick={() => handleItemClick(item)}
                  style={{ width: `${boxWidth}px` }}
                  class={`rounded-lg border p-2.5 flex flex-col justify-between cursor-pointer select-none transition-transform hover:scale-102 ${statusStyle}`}
                >
                  {/* Top: Rank + Fuel Icon + Status Dot */}
                  <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] font-mono font-bold text-slate-400">
                      #{item.rank}
                    </span>
                    <div class="flex items-center gap-1">
                      <IconComponent class="w-4 h-4" />
                      <span class={`w-2 h-2 rounded-full ${dotBg}`}></span>
                    </div>
                  </div>

                  {/* Middle: Prominent Output MW + Compact HoH Indicator */}
                  <div class="my-1 font-mono font-bold text-slate-900 tracking-tight">
                    <span class="text-base block leading-none">
                      {output.toLocaleString()}
                    </span>
                    <div class="flex items-center justify-between gap-1 text-[9.5px] text-slate-500 font-sans uppercase font-normal mt-0.5">
                      <span>MW Output</span>
                      {hohStrCompact && (
                        <span class="font-mono text-slate-600 font-semibold lowercase">
                          {hohStrCompact}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Fully Legible Item Name */}
                  <div class="text-xs font-bold text-slate-900 leading-tight tracking-tight truncate" title={item.displayName}>
                    {item.displayName}
                  </div>
                  {isGeneratorView && item.facilityName !== item.displayName && (
                    <div class="text-[10px] text-slate-500 font-medium truncate">
                      {item.facilityName}
                    </div>
                  )}
                </div>

                {/* Rich Hover Tooltip with HoH Detail */}
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl whitespace-nowrap min-w-[190px]">
                  <div class="font-bold border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-2">
                    <span>#{item.rank} {item.displayName}</span>
                    <span class={`text-[9px] px-1.5 py-0 rounded font-sans uppercase font-bold ${
                      item.status === 'generating' ? 'bg-emerald-500/30 text-emerald-300' :
                      item.status === 'idle' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-rose-500/30 text-rose-300'
                    }`}>
                      {item.statusLabel}
                    </span>
                  </div>

                  <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Fuel Type:</span>
                      <span class="text-slate-200">{item.sectionKey}</span>
                    </div>
                    {isGeneratorView && (
                      <div class="flex justify-between">
                        <span class="text-slate-400 font-sans">Facility:</span>
                        <span class="text-slate-200">{item.facilityName}</span>
                      </div>
                    )}
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Current Output:</span>
                      <span class="text-emerald-400 font-bold">{item.outputMW.toLocaleString()} MW</span>
                    </div>
                    {item.prevOutputMW !== null && (
                      <div class="flex justify-between text-slate-400">
                        <span class="font-sans">Prev Hour Output:</span>
                        <span>{item.prevOutputMW.toLocaleString()} MW</span>
                      </div>
                    )}
                    {hohStrFull && (
                      <div class="flex justify-between text-slate-200 border-t border-slate-800 pt-0.5 mt-0.5">
                        <span class="text-slate-400 font-sans">HoH Change:</span>
                        <span class="font-bold text-blue-300">{hohStrFull}</span>
                      </div>
                    )}
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Capability:</span>
                      <span>{item.capabilityMW.toLocaleString()} MW</span>
                    </div>
                    <div class="flex justify-between border-t border-slate-800 pt-0.5 mt-0.5">
                      <span class="text-slate-400 font-sans">Utilization:</span>
                      <span class="text-cyan-400">{item.utilization.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 2: Remaining Items (Compact 100% Readable Ranked List) */}
      <div>
        <div class="pt-2 pb-1.5 border-b border-slate-200 mb-2.5 flex items-baseline justify-between">
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-tight">
            {isGeneratorView
              ? `Additional Units (under ${threshold} MW & Idle / Outage)`
              : `Additional Facilities (under ${threshold} MW & Idle / Outage)`}
          </h3>
          <span class="text-[11px] text-slate-500 font-medium">
            {remainingItems.length} {isGeneratorView ? 'generators' : 'facilities'}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5">
          {remainingItems.map((item) => {
            const output = item.outputMW || 0;
            const IconComponent = FUEL_ICONS[item.fuelCategory] || Sparkles;
            const hohStrCompact = formatHoH(item.mwChange, item.pctChange, true);
            const hohStrFull = formatHoH(item.mwChange, item.pctChange, false);

            let dotBg = 'bg-emerald-500';
            if (item.status === 'idle') dotBg = 'bg-amber-400';
            else if (item.status === 'outage') dotBg = 'bg-rose-500';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                class="py-1.5 px-2.5 bg-slate-50/40 hover:bg-slate-100/80 rounded border border-slate-100 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer select-none relative group"
              >
                {/* Left: Rank, Name, Fuel Icon */}
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <span class="text-[10px] font-mono font-bold text-slate-400 w-6 shrink-0">
                    #{item.rank}
                  </span>

                  <div class="min-w-0 truncate">
                    <h4 class="font-bold text-slate-900 truncate tracking-tight leading-tight">
                      {item.displayName}
                    </h4>
                    {isGeneratorView && item.facilityName !== item.displayName && (
                      <span class="text-[10px] text-slate-400 block truncate leading-none">
                        {item.facilityName}
                      </span>
                    )}
                  </div>

                  <IconComponent class="w-3.5 h-3.5 text-slate-500 shrink-0 ml-auto" />
                </div>

                {/* Right: Output MW + Compact HoH + Status Indicator */}
                <div class="flex items-center gap-1.5 shrink-0 font-mono">
                  <div class="text-right">
                    <span class="font-semibold text-slate-800 block leading-tight">
                      {output.toLocaleString()} MW
                    </span>
                    {hohStrCompact && (
                      <span class="text-[9.5px] text-slate-500 block leading-none">
                        {hohStrCompact}
                      </span>
                    )}
                  </div>
                  <span class={`w-2 h-2 rounded-full ${dotBg}`}></span>
                </div>

                {/* Hover Tooltip */}
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl whitespace-nowrap min-w-[190px]">
                  <div class="font-bold border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-2">
                    <span>#{item.rank} {item.displayName}</span>
                    <span class={`text-[9px] px-1.5 py-0 rounded font-sans uppercase font-bold ${
                      item.status === 'generating' ? 'bg-emerald-500/30 text-emerald-300' :
                      item.status === 'idle' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-rose-500/30 text-rose-300'
                    }`}>
                      {item.statusLabel}
                    </span>
                  </div>

                  <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Fuel Type:</span>
                      <span class="text-slate-200">{item.sectionKey}</span>
                    </div>
                    {isGeneratorView && (
                      <div class="flex justify-between">
                        <span class="text-slate-400 font-sans">Facility:</span>
                        <span class="text-slate-200">{item.facilityName}</span>
                      </div>
                    )}
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Current Output:</span>
                      <span class="text-emerald-400 font-bold">{item.outputMW.toLocaleString()} MW</span>
                    </div>
                    {item.prevOutputMW !== null && (
                      <div class="flex justify-between text-slate-400">
                        <span class="font-sans">Prev Hour Output:</span>
                        <span>{item.prevOutputMW.toLocaleString()} MW</span>
                      </div>
                    )}
                    {hohStrFull && (
                      <div class="flex justify-between text-slate-200 border-t border-slate-800 pt-0.5 mt-0.5">
                        <span class="text-slate-400 font-sans">HoH Change:</span>
                        <span class="font-bold text-blue-300">{hohStrFull}</span>
                      </div>
                    )}
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Capability:</span>
                      <span>{item.capabilityMW.toLocaleString()} MW</span>
                    </div>
                  </div>

                  <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
