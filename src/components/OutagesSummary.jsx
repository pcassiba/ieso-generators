import React from 'react';
import { SECTION_KEYS } from '../utils/iesoParser';
import { AlertTriangle, Wrench } from 'lucide-react';

export default function OutagesSummary({ data }) {
  if (!data || !data.sections) return null;

  return (
    <div class="space-y-4">
      {/* Top Banner / Outage Summary Bar */}
      <div class="bg-rose-50/70 border border-rose-200/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <h2 class="font-bold text-rose-950 text-sm tracking-tight inline">
              Ontario Generation Outages
            </h2>
            <span class="text-rose-400 mx-2">•</span>
            <span class="text-rose-800 font-medium">
              Total Outage Capacity Impact: <strong class="text-rose-900 font-extrabold">{data.grandTotalUnavailableMW?.toLocaleString() || 0} MW</strong>
            </span>
          </div>
        </div>

        <div class="text-[11px] text-rose-700 font-semibold bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
          {data.grandTotalOutageUnits || 0} units currently unavailable
        </div>
      </div>

      {/* Fuel Sections */}
      {data.sections.map((section) => {
        // Filter facilities to only those with units on outage
        const outageFacilities = (section.facilities || [])
          .filter(fac => fac.outageUnitsCount > 0)
          .map(fac => ({
            ...fac,
            outageUnits: fac.units.filter(u => u.status === 'outage')
          }));

        if (outageFacilities.length === 0) {
          return (
            <section key={section.key} class="opacity-60">
              <div class="pt-2 pb-1 border-b border-slate-200 mb-1 flex items-baseline justify-between">
                <h2 class="text-sm font-bold tracking-tight text-slate-700">
                  {section.title}
                </h2>
                <span class="text-[11px] text-slate-400 font-normal">
                  0 facilities on outage
                </span>
              </div>
              <div class="py-1 text-slate-400 text-xs italic">
                No active outages reported for {section.title} generation.
              </div>
            </section>
          );
        }

        // Sort facilities by unavailable capability MW descending
        outageFacilities.sort((a, b) => b.totalUnavailableMW - a.totalUnavailableMW);

        const isNuclear = section.key === SECTION_KEYS.NUCLEAR;
        const gridLayoutClass = isNuclear
          ? "divide-y divide-rose-100"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3.5 gap-y-1.5";

        return (
          <section key={section.key}>
            {/* Section Header */}
            <div class="pt-2 pb-1 border-b border-slate-200 mb-2 flex items-baseline justify-between">
              <div class="flex items-baseline gap-2">
                <h2 class="text-sm font-bold tracking-tight text-slate-900">
                  {section.title}
                </h2>
                <span class="text-[11px] text-rose-700 font-medium">
                  {section.outageFacilitiesCount} {section.outageFacilitiesCount === 1 ? 'facility' : 'facilities'} · {section.outageUnitsCount} {section.outageUnitsCount === 1 ? 'unit' : 'units'} on outage
                </span>
              </div>

              <span class="text-[11px] text-slate-500 font-mono">
                {section.totalUnavailableMW?.toLocaleString() || 0} MW out
              </span>
            </div>

            {/* Affected Facilities List */}
            <div class={gridLayoutClass}>
              {outageFacilities.map((fac) => {
                const unavailMW = fac.totalUnavailableMW || 0;

                if (isNuclear) {
                  return (
                    <div key={fac.name} class="py-2 px-1 border-b border-rose-100 last:border-b-0 hover:bg-rose-50/40 transition-colors">
                      <div class="flex items-center justify-between gap-2 min-w-0">
                        <div class="flex items-center gap-2 shrink-0">
                          <h3 class="text-sm font-bold text-slate-900 tracking-tight">
                            {fac.name}
                          </h3>
                          <span class="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded border border-rose-200">
                            {fac.outageUnitsCount} {fac.outageUnitsCount === 1 ? 'unit' : 'units'} out
                          </span>
                        </div>

                        {/* Outage Unit Status Badges */}
                        <div class="flex items-center gap-2 overflow-x-auto min-w-0">
                          {fac.outageUnits.map((unit) => (
                            <div key={unit.genName} class="relative group shrink-0">
                              <div class="inline-flex items-center gap-1 text-[11px] font-mono select-none cursor-pointer bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-rose-800">
                                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span class="font-semibold text-rose-900">{unit.shortLabel}</span>
                              </div>

                              {/* Tooltip */}
                              <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2 rounded shadow-lg whitespace-nowrap min-w-[150px]">
                                <div class="font-bold border-b border-slate-700 pb-0.5 mb-1 flex items-center justify-between gap-2">
                                  <span>{unit.genName}</span>
                                  <span class="text-[9px] px-1 py-0 rounded font-sans uppercase font-bold bg-rose-500/30 text-rose-300">
                                    Outage
                                  </span>
                                </div>
                                <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                                  <div class="flex justify-between">
                                    <span class="text-slate-400 font-sans">Unavailable:</span>
                                    <span class="text-rose-400 font-bold">{unit.unavailableMW?.toLocaleString()} MW</span>
                                  </div>
                                </div>
                                <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div class="text-[11px] text-slate-500 font-normal leading-tight mt-1 flex items-center gap-2">
                        <span class="font-bold text-rose-700">{unavailMW.toLocaleString()} MW unavailable</span>
                        <span class="text-slate-300">·</span>
                        <span>{fac.units.length} total facility units</span>
                      </div>
                    </div>
                  );
                }

                // Gas, Hydro, Wind, Batteries outage card
                return (
                  <div key={fac.name} class="py-1.5 px-2.5 bg-rose-50/40 hover:bg-rose-100/70 rounded-md border border-rose-200/80 transition-colors flex flex-col justify-between min-h-[54px]">
                    <div class="flex items-center justify-between gap-1 min-w-0">
                      <h3 class="text-xs font-bold text-slate-900 tracking-tight truncate">
                        {fac.name}
                      </h3>
                      <span class="text-[10px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded shrink-0">
                        {fac.outageUnitsCount} out
                      </span>
                    </div>

                    {/* Unit Labels Row */}
                    <div class="flex items-center gap-1.5 flex-wrap my-0.5 min-w-0">
                      {fac.outageUnits.map((unit) => (
                        <div key={unit.genName} class="relative group shrink-0">
                          <div class="inline-flex items-center gap-1 text-[10.5px] font-mono select-none cursor-pointer">
                            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span class="font-semibold text-rose-800">{unit.shortLabel}</span>
                          </div>

                          <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white text-[11px] p-2 rounded shadow-lg whitespace-nowrap min-w-[150px]">
                            <div class="font-bold border-b border-slate-700 pb-0.5 mb-1 flex items-center justify-between gap-2">
                              <span>{unit.genName}</span>
                              <span class="text-[9px] px-1 py-0 rounded font-sans uppercase font-bold bg-rose-500/30 text-rose-300">
                                Outage
                              </span>
                            </div>
                            <div class="space-y-0.5 text-[10px] font-mono text-slate-300">
                              <div class="flex justify-between">
                                <span class="text-slate-400 font-sans">Unavailable:</span>
                                <span class="text-rose-400 font-bold">{unit.unavailableMW?.toLocaleString()} MW</span>
                              </div>
                            </div>
                            <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div class="text-[10.5px] font-bold text-rose-700 leading-none">
                      {unavailMW.toLocaleString()} MW unavailable
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
