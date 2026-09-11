import React from 'react';
import { Atom, Flame, Waves, Wind, BatteryCharging, Sparkles } from 'lucide-react';
import { SECTION_KEYS } from '../utils/iesoParser';

const SECTION_ICONS = {
  [SECTION_KEYS.NUCLEAR]: Atom,
  [SECTION_KEYS.GAS]: Flame,
  [SECTION_KEYS.HYDRO]: Waves,
  [SECTION_KEYS.WIND]: Wind,
  [SECTION_KEYS.BATTERIES]: BatteryCharging,
  [SECTION_KEYS.OTHER]: Sparkles
};

export default function VisualSummary({ data }) {
  if (!data || !data.sections) return null;

  return (
    <div class="space-y-6">
      {/* Minimal Legend for Visual Summary */}
      <div class="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 flex-wrap gap-2">
        <span class="font-medium text-slate-700">Visual Encoding: Icon Shape = Fuel · Color = Status · Size = Output MW (Square-Root Scaled)</span>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 text-[11px]">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Online</span>
          </div>
          <div class="flex items-center gap-1 text-[11px]">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Idle</span>
          </div>
          <div class="flex items-center gap-1 text-[11px]">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Outage</span>
          </div>
        </div>
      </div>

      {/* Fuel Type Sections */}
      {data.sections.map((section) => {
        const IconComponent = SECTION_ICONS[section.title] || Sparkles;

        // Collect all generator units across facilities in this section
        const allUnits = [];
        (section.facilities || []).forEach(facility => {
          (facility.units || []).forEach(unit => {
            allUnits.push({
              ...unit,
              facilityName: facility.name
            });
          });
        });

        // Sort units by output MW descending
        allUnits.sort((a, b) => b.outputMW - a.outputMW);

        return (
          <section key={section.key}>
            {/* Section Title with Total Output MW */}
            <div class="pt-2 pb-1 border-b border-slate-200 mb-2 flex items-baseline justify-between">
              <h2 class="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>{section.title}</span>
                <span class="text-slate-400 font-normal">·</span>
                <span class="text-slate-700 font-mono text-xs">{section.totalOutputMW.toLocaleString()} MW</span>
              </h2>
              <span class="text-[11px] text-slate-400 font-normal">
                {allUnits.length} units ({section.facilitiesCount} facilities)
              </span>
            </div>

            {/* Packed Icon Visual Cluster */}
            <div class="flex flex-wrap items-center gap-2 py-1">
              {allUnits.map((unit) => {
                const output = unit.outputMW || 0;

                // Dynamic Square-Root Size Calculation
                // 0 MW: 30px box / 14px icon
                // 800 MW: 58px box / 26px icon
                const boxSize = Math.min(62, Math.max(30, Math.round(30 + Math.sqrt(output) * 1.05)));
                const iconSize = Math.min(26, Math.max(14, Math.round(14 + Math.sqrt(output) * 0.42)));

                let statusStyle = 'bg-emerald-50 text-emerald-600 border-emerald-300 hover:bg-emerald-100 shadow-xs';
                let dotBg = 'bg-emerald-500';

                if (unit.status === 'idle') {
                  statusStyle = 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100 shadow-xs';
                  dotBg = 'bg-amber-400';
                } else if (unit.status === 'outage') {
                  statusStyle = 'bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100 shadow-xs';
                  dotBg = 'bg-rose-500';
                }

                // Micro label: e.g. "Bruce G1" for Nuclear; short label for others
                const displayLabel = section.key === SECTION_KEYS.NUCLEAR
                  ? `${unit.facilityName.split(' ')[0]} ${unit.shortLabel}`
                  : (allUnits.length <= 15 ? `${unit.facilityName.slice(0, 8)} ${unit.shortLabel}` : unit.shortLabel);

                return (
                  <div key={`${unit.facilityName}-${unit.genName}`} class="relative group">
                    {/* Square-Root Scaled Icon Chip Container */}
                    <div
                      style={{ width: `${boxSize}px`, height: `${boxSize}px` }}
                      class={`rounded-lg border flex flex-col items-center justify-center cursor-pointer select-none transition-transform hover:scale-110 ${statusStyle}`}
                    >
                      <IconComponent style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
                      
                      {boxSize >= 36 && (
                        <span class="text-[9.5px] font-mono font-semibold truncate max-w-full px-0.5 leading-none mt-0.5">
                          {unit.shortLabel}
                        </span>
                      )}
                    </div>

                    {/* Rich Hover Tooltip */}
                    <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl whitespace-nowrap min-w-[160px]">
                      <div class="font-bold border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-2">
                        <span>{unit.facilityName} ({unit.shortLabel})</span>
                        <span class={`text-[9px] px-1.5 py-0 rounded font-sans uppercase font-bold ${
                          unit.status === 'online' ? 'bg-emerald-500/30 text-emerald-300' :
                          unit.status === 'idle' ? 'bg-amber-500/30 text-amber-300' :
                          'bg-rose-500/30 text-rose-300'
                        }`}>
                          {unit.statusLabel}
                        </span>
                      </div>

                      <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                        <div class="flex justify-between">
                          <span class="text-slate-400 font-sans">Generator:</span>
                          <span class="text-slate-200">{unit.genName}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-slate-400 font-sans">Current Output:</span>
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
          </section>
        );
      })}
    </div>
  );
}
