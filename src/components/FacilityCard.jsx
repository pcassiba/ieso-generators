import React from 'react';
import { SECTION_KEYS, formatHoH } from '../utils/iesoParser';

export default function FacilityCard({ facility, onSelectFacility, onSelectGenerator }) {
  const capabilityFormatted = facility.totalCapabilityMW.toLocaleString();
  const outputFormatted = facility.totalOutputMW.toLocaleString();
  const isNuclear = facility.sectionKey === SECTION_KEYS.NUCLEAR;
  const hohStr = formatHoH(facility.totalMwChange, facility.totalPctChange, true);

  const handleCardClick = (e) => {
    if (onSelectFacility) {
      onSelectFacility(facility);
    }
  };

  const handleUnitClick = (e, unit) => {
    e.stopPropagation();
    if (onSelectGenerator) {
      onSelectGenerator(unit);
    } else if (onSelectFacility) {
      onSelectFacility(facility);
    }
  };

  // Nuclear: Unboxed 2-line compact row (~45-50px tall)
  if (isNuclear) {
    return (
      <div
        onClick={handleCardClick}
        class="py-1.5 px-1 border-b border-slate-100/80 last:border-b-0 hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
      >
        {/* Line 1: Facility Name & Status Dots */}
        <div class="flex items-center justify-between gap-2 min-w-0">
          <h3 class="text-sm font-bold text-slate-900 tracking-tight shrink-0 hover:text-blue-600 transition-colors">
            {facility.name}
          </h3>

          {/* Generator Status Dots Row */}
          <div class="flex items-center gap-2 overflow-x-auto min-w-0">
            {facility.units.map((unit) => {
              let dotBg = 'bg-emerald-500';
              let labelColor = 'text-slate-700';

              if (unit.status === 'idle') {
                dotBg = 'bg-amber-400';
              } else if (unit.status === 'outage') {
                dotBg = 'bg-rose-500';
                labelColor = 'text-rose-700';
              }

              const unitHohStr = formatHoH(unit.mwChange, unit.pctChange, true);

              return (
                <div key={unit.genName} class="relative group shrink-0">
                  <div
                    onClick={(e) => handleUnitClick(e, unit)}
                    class="inline-flex items-center gap-1 text-[11px] font-mono select-none cursor-pointer hover:underline"
                  >
                    <span class={`w-1.5 h-1.5 rounded-full ${dotBg}`}></span>
                    <span class={`font-medium ${labelColor}`}>{unit.shortLabel}</span>
                  </div>

                  {/* Tooltip with HoH information */}
                  <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2 rounded shadow-lg whitespace-nowrap min-w-[160px]">
                    <div class="font-bold border-b border-slate-700 pb-0.5 mb-1 flex items-center justify-between gap-2">
                      <span>{unit.genName}</span>
                      <span class={`text-[9px] px-1 py-0 rounded font-sans uppercase font-bold ${
                        unit.status === 'online' ? 'bg-emerald-500/30 text-emerald-300' :
                        unit.status === 'idle' ? 'bg-amber-500/30 text-amber-300' :
                        'bg-rose-500/30 text-rose-300'
                      }`}>
                        {unit.statusLabel}
                      </span>
                    </div>

                    <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                      <div class="flex justify-between">
                        <span class="text-slate-400 font-sans">Current Output:</span>
                        <span class="text-emerald-400 font-bold">{unit.outputMW.toLocaleString()} MW</span>
                      </div>
                      {unit.prevOutputMW !== null && (
                        <div class="flex justify-between text-slate-400">
                          <span class="font-sans">Prev Hour Output:</span>
                          <span>{unit.prevOutputMW.toLocaleString()} MW</span>
                        </div>
                      )}
                      {unitHohStr && (
                        <div class="flex justify-between text-slate-300 border-t border-slate-800 pt-0.5 mt-0.5">
                          <span class="text-slate-400 font-sans">HoH Change:</span>
                          <span class="font-bold">{unitHohStr}</span>
                        </div>
                      )}
                      <div class="flex justify-between">
                        <span class="text-slate-400 font-sans">Capability:</span>
                        <span>{unit.capabilityMW.toLocaleString()} MW</span>
                      </div>
                    </div>

                    <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Line 2: Capability & Output MW Metrics + HoH Change */}
        <div class="text-[11px] text-slate-500 font-normal leading-tight mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span>{capabilityFormatted} MW cap</span>
          <span class="text-slate-300">·</span>
          <span class="font-semibold text-slate-700">{outputFormatted} MW out</span>
          {hohStr && (
            <span class="text-slate-500 font-mono text-[10.5px]">
              ({hohStr})
            </span>
          )}
        </div>
      </div>
    );
  }

  // Gas, Hydro, Wind, Batteries: Ultra-compact 3-line panel block (~50-55px tall)
  return (
    <div
      onClick={handleCardClick}
      class="py-1.5 px-2.5 bg-slate-50/40 hover:bg-slate-100/90 rounded-md border border-slate-100 hover:border-slate-200 transition-colors flex flex-col justify-between min-h-[50px] max-h-[56px] cursor-pointer select-none"
    >
      {/* Line 1: Facility Name */}
      <div class="flex items-center justify-between gap-1 min-w-0">
        <h3 class="text-xs font-bold text-slate-900 tracking-tight truncate hover:text-blue-600 transition-colors">
          {facility.name}
        </h3>
        {hohStr && (
          <span class="text-[10px] font-mono text-slate-500 shrink-0">
            {hohStr}
          </span>
        )}
      </div>

      {/* Line 2: Unit Status Dots */}
      <div class="flex items-center gap-1.5 flex-wrap my-0.5 min-w-0">
        {facility.units.map((unit) => {
          let dotBg = 'bg-emerald-500';
          let labelColor = 'text-slate-700';

          if (unit.status === 'idle') {
            dotBg = 'bg-amber-400';
          } else if (unit.status === 'outage') {
            dotBg = 'bg-rose-500';
            labelColor = 'text-rose-700';
          }

          const unitHohStr = formatHoH(unit.mwChange, unit.pctChange, true);

          return (
            <div key={unit.genName} class="relative group shrink-0">
              <div
                onClick={(e) => handleUnitClick(e, unit)}
                class="inline-flex items-center gap-1 text-[10.5px] font-mono select-none cursor-pointer hover:underline"
              >
                <span class={`w-1.5 h-1.5 rounded-full ${dotBg}`}></span>
                <span class={`font-medium ${labelColor}`}>{unit.shortLabel}</span>
              </div>

              {/* Tooltip */}
              <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2 rounded shadow-lg whitespace-nowrap min-w-[160px]">
                <div class="font-bold border-b border-slate-700 pb-0.5 mb-1 flex items-center justify-between gap-2">
                  <span>{unit.genName}</span>
                  <span class={`text-[9px] px-1 py-0 rounded font-sans uppercase font-bold ${
                    unit.status === 'online' ? 'bg-emerald-500/30 text-emerald-300' :
                    unit.status === 'idle' ? 'bg-amber-500/30 text-amber-300' :
                    'bg-rose-500/30 text-rose-300'
                  }`}>
                    {unit.statusLabel}
                  </span>
                </div>

                <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                  <div class="flex justify-between">
                    <span class="text-slate-400 font-sans">Current Output:</span>
                    <span class="text-emerald-400 font-bold">{unit.outputMW.toLocaleString()} MW</span>
                  </div>
                  {unit.prevOutputMW !== null && (
                    <div class="flex justify-between text-slate-400">
                      <span class="font-sans">Prev Hour Output:</span>
                      <span>{unit.prevOutputMW.toLocaleString()} MW</span>
                    </div>
                  )}
                  {unitHohStr && (
                    <div class="flex justify-between text-slate-300 border-t border-slate-800 pt-0.5 mt-0.5">
                      <span class="text-slate-400 font-sans">HoH Change:</span>
                      <span class="font-bold">{unitHohStr}</span>
                    </div>
                  )}
                  <div class="flex justify-between">
                    <span class="text-slate-400 font-sans">Capability:</span>
                    <span>{unit.capabilityMW.toLocaleString()} MW</span>
                  </div>
                </div>

                <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Line 3: Compact Metrics Line */}
      <div class="text-[10.5px] text-slate-500 font-normal leading-none">
        <span>{capabilityFormatted} MW cap</span>
        <span class="mx-1 text-slate-300">·</span>
        <span class="font-semibold text-slate-700">{outputFormatted} MW out</span>
      </div>
    </div>
  );
}
