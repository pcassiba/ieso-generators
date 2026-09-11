import React from 'react';
import { Atom, Flame, Waves, Wind, BatteryCharging, Sparkles } from 'lucide-react';
import { SECTION_KEYS } from '../utils/iesoParser';

const FUEL_ICONS = {
  'NUCLEAR': Atom,
  'GAS': Flame,
  'HYDRO': Waves,
  'WIND': Wind,
  'BATTERIES': BatteryCharging,
  'OTHER': Sparkles
};

export default function Visualization({ data }) {
  if (!data || !data.sections) return null;

  // Merge all facilities across all sections into one unified list
  const allFacilities = [];

  data.sections.forEach(section => {
    (section.facilities || []).forEach(fac => {
      let status = 'outage';
      let statusLabel = 'Outage';

      if (fac.totalOutputMW > 0) {
        status = 'generating';
        statusLabel = 'Generating';
      } else if (fac.totalCapabilityMW > 0) {
        status = 'idle';
        statusLabel = 'Idle';
      }

      let sectionFuelKey = section.key;

      if (sectionFuelKey === SECTION_KEYS.NUCLEAR) sectionFuelKey = 'NUCLEAR';
      else if (sectionFuelKey === SECTION_KEYS.GAS) sectionFuelKey = 'GAS';
      else if (sectionFuelKey === SECTION_KEYS.HYDRO) sectionFuelKey = 'HYDRO';
      else if (sectionFuelKey === SECTION_KEYS.WIND) sectionFuelKey = 'WIND';
      else if (sectionFuelKey === SECTION_KEYS.BATTERIES) sectionFuelKey = 'BATTERIES';
      else sectionFuelKey = 'OTHER';

      allFacilities.push({
        ...fac,
        status,
        statusLabel,
        fuelCategory: sectionFuelKey,
        utilization: fac.totalCapabilityMW > 0 ? (fac.totalOutputMW / fac.totalCapabilityMW) * 100 : 0
      });
    });
  });

  // Sort strictly by current output MW descending
  allFacilities.sort((a, b) => {
    if (b.totalOutputMW !== a.totalOutputMW) {
      return b.totalOutputMW - a.totalOutputMW;
    }
    return b.totalCapabilityMW - a.totalCapabilityMW;
  });

  // Assign rank numbers
  const rankedFacilities = allFacilities.map((fac, idx) => ({
    ...fac,
    rank: idx + 1
  }));

  // Partition into Top Generators (producing >= 80 MW) and Remaining Generators
  const topGenerators = rankedFacilities.filter(f => f.totalOutputMW >= 80);
  const remainingGenerators = rankedFacilities.filter(f => f.totalOutputMW < 80);

  const formattedCreated = data.createdAt
    ? new Date(data.createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'N/A';

  return (
    <div class="space-y-5">
      {/* Top Header Bar for Visualization */}
      <div class="bg-slate-50/80 border border-slate-200/80 rounded-lg p-3 space-y-2 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <h2 class="font-bold text-slate-900 text-sm tracking-tight">
              Visualization
            </h2>
            <span class="text-slate-300">•</span>
            <span class="text-slate-500 font-normal">
              Unified Output Ranking ({rankedFacilities.length} facilities)
            </span>
          </div>

          <div class="text-slate-500 text-[11px]">
            Report Time: <strong class="text-slate-700">{formattedCreated}</strong>
          </div>
        </div>

        {/* Legend Row: Status Colors + Fuel Type Icons */}
        <div class="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-600">
          {/* Status Colors Legend */}
          <div class="flex items-center gap-3">
            <span class="font-semibold text-slate-700">Status:</span>
            <div class="flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Generating</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Idle</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Outage</span>
            </div>
          </div>

          {/* Fuel Type Icons Legend */}
          <div class="flex items-center gap-3.5 flex-wrap">
            <span class="font-semibold text-slate-700">Fuel Icons:</span>
            <div class="flex items-center gap-1 text-slate-700">
              <Atom class="w-4 h-4 text-blue-600" />
              <span>Nuclear</span>
            </div>
            <div class="flex items-center gap-1 text-slate-700">
              <Flame class="w-4 h-4 text-orange-600" />
              <span>Gas</span>
            </div>
            <div class="flex items-center gap-1 text-slate-700">
              <Waves class="w-4 h-4 text-cyan-600" />
              <span>Hydro</span>
            </div>
            <div class="flex items-center gap-1 text-slate-700">
              <Wind class="w-4 h-4 text-emerald-600" />
              <span>Wind</span>
            </div>
            <div class="flex items-center gap-1 text-slate-700">
              <BatteryCharging class="w-4 h-4 text-purple-600" />
              <span>Batteries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Part 1: Top Generating Facilities (Generous Visual Cards) */}
      <div>
        <div class="pt-1 pb-2 border-b border-slate-200 mb-3 flex items-baseline justify-between">
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-tight">
            Top Generating Facilities (≥ 80 MW)
          </h3>
          <span class="text-[11px] text-slate-500">
            {topGenerators.length} facilities
          </span>
        </div>

        <div class="flex flex-wrap items-stretch gap-3">
          {topGenerators.map((fac) => {
            const output = fac.totalOutputMW || 0;
            const IconComponent = FUEL_ICONS[fac.fuelCategory] || Sparkles;

            const boxWidth = Math.min(170, Math.max(135, Math.round(135 + Math.sqrt(output) * 0.45)));

            let statusStyle = 'bg-emerald-50/70 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-2xs';
            let dotBg = 'bg-emerald-500';

            if (fac.status === 'idle') {
              statusStyle = 'bg-amber-50/70 text-amber-700 border-amber-300 hover:bg-amber-100 shadow-2xs';
              dotBg = 'bg-amber-400';
            } else if (fac.status === 'outage') {
              statusStyle = 'bg-rose-50/70 text-rose-700 border-rose-300 hover:bg-rose-100 shadow-2xs';
              dotBg = 'bg-rose-500';
            }

            return (
              <div key={fac.name} class="relative group">
                {/* Generous Visual Card */}
                <div
                  style={{ width: `${boxWidth}px` }}
                  class={`rounded-lg border p-2.5 flex flex-col justify-between cursor-pointer select-none transition-transform hover:scale-102 ${statusStyle}`}
                >
                  {/* Top: Rank + Fuel Icon + Status Dot */}
                  <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] font-mono font-bold text-slate-400">
                      #{fac.rank}
                    </span>
                    <div class="flex items-center gap-1">
                      <IconComponent class="w-4 h-4" />
                      <span class={`w-2 h-2 rounded-full ${dotBg}`}></span>
                    </div>
                  </div>

                  {/* Middle: Prominent Output MW */}
                  <div class="my-1.5 font-mono font-bold text-slate-900 tracking-tight">
                    <span class="text-base block leading-none">
                      {output.toLocaleString()}
                    </span>
                    <span class="text-[9.5px] text-slate-500 font-sans uppercase block mt-0.5">MW Output</span>
                  </div>

                  {/* Bottom: Fully Legible Facility Name */}
                  <div class="text-xs font-bold text-slate-900 leading-tight tracking-tight">
                    {fac.name}
                  </div>
                </div>

                {/* Rich Hover Tooltip */}
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl whitespace-nowrap min-w-[180px]">
                  <div class="font-bold border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-2">
                    <span>#{fac.rank} {fac.name}</span>
                    <span class={`text-[9px] px-1.5 py-0 rounded font-sans uppercase font-bold ${
                      fac.status === 'generating' ? 'bg-emerald-500/30 text-emerald-300' :
                      fac.status === 'idle' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-rose-500/30 text-rose-300'
                    }`}>
                      {fac.statusLabel}
                    </span>
                  </div>

                  <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Fuel Type:</span>
                      <span class="text-slate-200">{fac.sectionKey}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Current Output:</span>
                      <span class="text-emerald-400 font-bold">{fac.totalOutputMW.toLocaleString()} MW</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Capability:</span>
                      <span>{fac.totalCapabilityMW.toLocaleString()} MW</span>
                    </div>
                    <div class="flex justify-between border-t border-slate-800 pt-0.5 mt-0.5">
                      <span class="text-slate-400 font-sans">Utilization:</span>
                      <span class="text-cyan-400">{fac.utilization.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 2: Remaining Facilities (Compact 100% Readable Ranked List) */}
      <div>
        <div class="pt-2 pb-2 border-b border-slate-200 mb-3 flex items-baseline justify-between">
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-tight">
            Additional Facilities (under 80 MW & Idle / Outage)
          </h3>
          <span class="text-[11px] text-slate-500">
            {remainingGenerators.length} facilities
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5">
          {remainingGenerators.map((fac) => {
            const output = fac.totalOutputMW || 0;
            const IconComponent = FUEL_ICONS[fac.fuelCategory] || Sparkles;

            let dotBg = 'bg-emerald-500';
            if (fac.status === 'idle') dotBg = 'bg-amber-400';
            else if (fac.status === 'outage') dotBg = 'bg-rose-500';

            return (
              <div
                key={fac.name}
                class="py-1.5 px-2.5 bg-slate-50/40 hover:bg-slate-100/80 rounded border border-slate-100 flex items-center justify-between gap-2 text-xs transition-colors relative group"
              >
                {/* Left: Rank, Name, Fuel Icon */}
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <span class="text-[10px] font-mono font-bold text-slate-400 w-6 shrink-0">
                    #{fac.rank}
                  </span>

                  <h4 class="font-bold text-slate-900 truncate tracking-tight">
                    {fac.name}
                  </h4>

                  <IconComponent class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </div>

                {/* Right: Output MW & Status Indicator */}
                <div class="flex items-center gap-2 shrink-0">
                  <span class="font-mono font-semibold text-slate-800">
                    {output.toLocaleString()} MW
                  </span>
                  <span class={`w-2 h-2 rounded-full ${dotBg}`}></span>
                </div>

                {/* Hover Tooltip */}
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl whitespace-nowrap min-w-[180px]">
                  <div class="font-bold border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-2">
                    <span>#{fac.rank} {fac.name}</span>
                    <span class={`text-[9px] px-1.5 py-0 rounded font-sans uppercase font-bold ${
                      fac.status === 'generating' ? 'bg-emerald-500/30 text-emerald-300' :
                      fac.status === 'idle' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-rose-500/30 text-rose-300'
                    }`}>
                      {fac.statusLabel}
                    </span>
                  </div>

                  <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Fuel Type:</span>
                      <span class="text-slate-200">{fac.sectionKey}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Current Output:</span>
                      <span class="text-emerald-400 font-bold">{fac.totalOutputMW.toLocaleString()} MW</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-sans">Capability:</span>
                      <span>{fac.totalCapabilityMW.toLocaleString()} MW</span>
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
