import React from 'react';
import { CheckCircle2, PauseCircle, AlertOctagon } from 'lucide-react';

export default function UnitTable({ units }) {
  if (!units || units.length === 0) return null;

  return (
    <div class="mt-3 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th class="py-2.5 px-4">Unit / Generator</th>
              <th class="py-2.5 px-4">Status</th>
              <th class="py-2.5 px-4 text-right">Output (MW)</th>
              <th class="py-2.5 px-4 text-right">Capability (MW)</th>
              <th class="py-2.5 px-4 text-right">Available (MW)</th>
              <th class="py-2.5 px-4 text-right">Capacity Factor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-mono">
            {units.map((unit) => {
              const capFactor = unit.capabilityMW > 0 ? (unit.outputMW / unit.capabilityMW) * 100 : 0;
              
              let statusBadge = null;
              if (unit.status === 'online') {
                statusBadge = (
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 class="w-3 h-3" /> Online
                  </span>
                );
              } else if (unit.status === 'idle') {
                statusBadge = (
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <PauseCircle class="w-3 h-3" /> Idle
                  </span>
                );
              } else {
                statusBadge = (
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <AlertOctagon class="w-3 h-3" /> Outage
                  </span>
                );
              }

              return (
                <tr key={unit.genName} class="hover:bg-slate-900/50 transition-colors">
                  <td class="py-2.5 px-4 text-white font-medium font-sans flex items-center gap-2">
                    <span class={`w-2 h-2 rounded-full ${
                      unit.status === 'online' ? 'bg-emerald-400 shadow-sm shadow-emerald-400' :
                      unit.status === 'idle' ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-rose-500 shadow-sm shadow-rose-500'
                    }`}></span>
                    <span>{unit.genName}</span>
                  </td>
                  <td class="py-2.5 px-4">
                    {statusBadge}
                  </td>
                  <td class="py-2.5 px-4 text-right text-cyan-300 font-bold">
                    {unit.outputMW.toLocaleString()}
                  </td>
                  <td class="py-2.5 px-4 text-right text-slate-300">
                    {unit.capabilityMW.toLocaleString()}
                  </td>
                  <td class="py-2.5 px-4 text-right text-slate-400">
                    {unit.availMW !== undefined ? unit.availMW.toLocaleString() : 'N/A'}
                  </td>
                  <td class="py-2.5 px-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <span class="text-slate-200">{capFactor.toFixed(0)}%</span>
                      <div class="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          class="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${Math.min(capFactor, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
