import React from 'react';
import { SECTION_KEYS } from '../utils/iesoParser';

export default function FacilityCard({ facility }) {
  const capabilityFormatted = facility.totalCapabilityMW.toLocaleString();
  const outputFormatted = facility.totalOutputMW.toLocaleString();
  const isNuclear = facility.sectionKey === SECTION_KEYS.NUCLEAR;

  // Nuclear: Unboxed 2-line compact row (~45-50px tall)
  if (isNuclear) {
    return (
      <div class="py-1.5 px-1 border-b border-slate-100/80 last:border-b-0 hover:bg-slate-50/60 transition-colors">
        {/* Line 1: Facility Name & Status Dots */}
        <div class="flex items-center justify-between gap-2 min-w-0">
          <h3 class="text-sm font-bold text-slate-900 tracking-tight shrink-0">
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

              return (
                <div key={unit.genName} class="relative group shrink-0">
                  <div class="inline-flex items-center gap-1 text-[11px] font-mono select-none cursor-pointer">
                    <span class={`w-1.5 h-1.5 rounded-full ${dotBg}`}></span>
                    <span class={`font-medium ${labelColor}`}>{unit.shortLabel}</span>
                  </div>

                  {/* Tooltip */}
                  <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2 rounded shadow-lg whitespace-nowrap min-w-[140px]">
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
                        <span class="text-slate-400 font-sans">Output:</span>
                        <span class="text-emerald-400 font-bold">{unit.outputMW.toLocaleString()} MW</span>
                      </div>
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

        {/* Line 2: Capability & Output MW Metrics */}
        <div class="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
          <span>{capabilityFormatted} MW cap</span>
          <span class="mx-1 text-slate-300">·</span>
          <span class="font-semibold text-slate-700">{outputFormatted} MW out</span>
        </div>
      </div>
    );
  }

  // Gas, Hydro, Wind, Batteries: Ultra-compact 3-line panel block (~50-55px tall)
  return (
    <div class="py-1.5 px-2.5 bg-slate-50/40 hover:bg-slate-100/80 rounded-md border border-slate-100 transition-colors flex flex-col justify-between min-h-[50px] max-h-[56px]">
      {/* Line 1: Facility Name */}
      <div class="flex items-center justify-between gap-1 min-w-0">
        <h3 class="text-xs font-bold text-slate-900 tracking-tight truncate">
          {facility.name}
        </h3>
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

          return (
            <div key={unit.genName} class="relative group shrink-0">
              <div class="inline-flex items-center gap-1 text-[10.5px] font-mono select-none cursor-pointer">
                <span class={`w-1.5 h-1.5 rounded-full ${dotBg}`}></span>
                <span class={`font-medium ${labelColor}`}>{unit.shortLabel}</span>
              </div>

              {/* Tooltip */}
              <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2 rounded shadow-lg whitespace-nowrap min-w-[140px]">
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
                    <span class="text-slate-400 font-sans">Output:</span>
                    <span class="text-emerald-400 font-bold">{unit.outputMW.toLocaleString()} MW</span>
                  </div>
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
