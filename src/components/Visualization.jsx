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

      const fuelKey = (fac.fuelType || '').toUpperCase();
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

  const formattedCreated = data.createdAt
    ? new Date(data.createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'N/A';

  return (
    <div class="space-y-4">
      {/* Top Header Bar for Visualization */}
      <div class="bg-slate-50/80 border border-slate-200/80 rounded-lg p-3 space-y-2 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <h2 class="font-bold text-slate-900 text-sm tracking-tight">
              Visualization
            </h2>
            <span class="text-slate-300">•</span>
            <span class="text-slate-500 font-normal">
              Ontario Facility Output Ranking ({allFacilities.length} facilities)
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

      {/* Unified Output-Ranked Wrapping Grid */}
      <div class="flex flex-wrap items-end gap-2.5 py-1">
        {allFacilities.map((fac) => {
          const output = fac.totalOutputMW || 0;
          const IconComponent = FUEL_ICONS[fac.fuelCategory] || Sparkles;

          // Refined Sizing: Larger Icons (20px - 34px) & Generous Cards (62px - 125px)
          const boxWidth = Math.min(125, Math.max(62, Math.round(62 + Math.sqrt(output) * 0.75)));
          const boxHeight = Math.min(115, Math.max(58, Math.round(58 + Math.sqrt(output) * 0.70)));
          const iconSize = Math.min(34, Math.max(20, Math.round(20 + Math.sqrt(output) * 0.22)));

          let statusStyle = 'bg-emerald-50/80 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-2xs';

          if (fac.status === 'idle') {
            statusStyle = 'bg-amber-50/80 text-amber-700 border-amber-300 hover:bg-amber-100 shadow-2xs';
          } else if (fac.status === 'outage') {
            statusStyle = 'bg-rose-50/80 text-rose-700 border-rose-300 hover:bg-rose-100 shadow-2xs';
          }

          return (
            <div key={fac.name} class="relative group">
              {/* Aggregated Facility Card with Larger Symbols & Refined Text */}
              <div
                style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
                class={`rounded-lg border p-1.5 flex flex-col items-center justify-between cursor-pointer select-none transition-transform hover:scale-105 ${statusStyle}`}
              >
                {/* Top: Larger Fuel Type Symbol */}
                <IconComponent style={{ width: `${iconSize}px`, height: `${iconSize}px` }} class="shrink-0" />

                {/* Middle: Prominent MW Output */}
                <div class="text-center font-mono font-bold leading-tight my-0.5">
                  <span class="text-xs sm:text-sm text-slate-900 block tracking-tight">
                    {output.toLocaleString()}
                  </span>
                  <span class="text-[9px] text-slate-500 font-sans uppercase block -mt-0.5">MW</span>
                </div>

                {/* Bottom: Crisp Plant / Facility Name */}
                <div class="text-[9.5px] font-semibold text-slate-700 truncate w-full text-center leading-none tracking-tight px-0.5">
                  {fac.name}
                </div>
              </div>

              {/* Rich Hover Tooltip */}
              <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl whitespace-nowrap min-w-[180px]">
                <div class="font-bold border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-2">
                  <span>{fac.name}</span>
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
                    <span class="text-slate-400 font-sans">Fuel Category:</span>
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
                  {fac.units && fac.units.length > 0 && (
                    <div class="border-t border-slate-800 pt-1 mt-1 text-[9.5px]">
                      <span class="text-slate-400 font-sans block mb-0.5">Units ({fac.units.length}):</span>
                      <div class="max-h-24 overflow-y-auto space-y-0.5">
                        {fac.units.map(u => (
                          <div key={u.genName} class="flex justify-between">
                            <span>{u.shortLabel} ({u.genName})</span>
                            <span class={u.outputMW > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                              {u.outputMW} MW
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
