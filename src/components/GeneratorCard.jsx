import React from 'react';
import { formatHoH } from '../utils/iesoParser';

export default function GeneratorCard({ unit, onSelectGenerator }) {
  const capabilityFormatted = (unit.capabilityMW || 0).toLocaleString();
  const outputFormatted = (unit.outputMW || 0).toLocaleString();
  const hohStr = formatHoH(unit.mwChange, unit.pctChange, true);

  let dotBg = 'bg-emerald-500';
  let statusText = 'text-emerald-700';
  let borderStyle = 'border-slate-100 bg-slate-50/40 hover:bg-slate-100/90';

  if (unit.status === 'idle') {
    dotBg = 'bg-amber-400';
    statusText = 'text-amber-700';
  } else if (unit.status === 'outage') {
    dotBg = 'bg-rose-500';
    statusText = 'text-rose-700';
    borderStyle = 'border-rose-100 bg-rose-50/30 hover:bg-rose-50/70';
  }

  const handleClick = () => {
    if (onSelectGenerator) {
      onSelectGenerator(unit);
    }
  };

  return (
    <div
      onClick={handleClick}
      class={`py-1.5 px-2.5 rounded-md border transition-colors flex flex-col justify-between min-h-[50px] cursor-pointer select-none ${borderStyle}`}
    >
      {/* Line 1: Generator Name & Status Dot */}
      <div class="flex items-center justify-between gap-1 min-w-0">
        <h3 class="text-xs font-bold text-slate-900 tracking-tight truncate hover:text-blue-600 transition-colors">
          {unit.genName}
        </h3>
        <div class="flex items-center gap-1 shrink-0 text-[10.5px]">
          <span class={`w-1.5 h-1.5 rounded-full ${dotBg}`}></span>
          <span class={`font-medium ${statusText}`}>{unit.statusLabel}</span>
        </div>
      </div>

      {/* Line 2: Parent Facility Context */}
      <div class="text-[10.5px] text-slate-400 font-medium truncate flex items-center justify-between gap-1">
        <span>Facility: <strong class="text-slate-600 font-semibold">{unit.facilityName}</strong></span>
        {hohStr && (
          <span class="text-slate-500 font-mono text-[10px] shrink-0">
            {hohStr}
          </span>
        )}
      </div>

      {/* Line 3: Capability & Output MW */}
      <div class="text-[10.5px] text-slate-500 font-normal leading-none mt-0.5">
        <span>{capabilityFormatted} MW cap</span>
        <span class="mx-1 text-slate-300">·</span>
        <span class="font-semibold text-slate-700">{outputFormatted} MW out</span>
      </div>
    </div>
  );
}
