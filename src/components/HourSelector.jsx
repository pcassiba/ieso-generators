import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HourSelector({ availableHours, activeHour, onSelectHour }) {
  if (!availableHours || availableHours.length <= 1) return null;

  const maxHour = Math.max(...availableHours);

  return (
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
      <div class="flex items-center gap-2 text-xs text-slate-300">
        <Calendar class="w-4 h-4 text-cyan-400" />
        <span class="font-medium">Select Hourly Snapshot:</span>
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-thin">
        {availableHours.map((h) => {
          const isActive = h === activeHour;
          const isLatest = h === maxHour;

          return (
            <button
              key={h}
              onClick={() => onSelectHour(h)}
              class={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>HE {h}</span>
              {isLatest && (
                <span class={`text-[9px] px-1 rounded uppercase tracking-wider font-sans ${
                  isActive ? 'bg-slate-950 text-cyan-400 font-bold' : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  Latest
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
