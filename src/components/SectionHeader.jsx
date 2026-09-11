import React from 'react';

export default function SectionHeader({ section, viewMode = 'facility' }) {
  return (
    <div class="pt-2 pb-1 border-b border-slate-200 mb-1.5 flex items-baseline gap-2">
      <h2 class="text-sm font-bold tracking-tight text-slate-900">
        {section.title}
      </h2>
      <span class="text-[11px] text-slate-400 font-normal">
        {viewMode === 'generator'
          ? `${section.unitsCount} generators (${section.facilitiesCount} facilities)`
          : `${section.facilitiesCount} ${section.facilitiesCount === 1 ? 'facility' : 'facilities'} · ${section.unitsCount} units`
        }
      </span>
    </div>
  );
}
