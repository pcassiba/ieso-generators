import React from 'react';

export default function SectionHeader({ section, viewMode = 'facility' }) {
  const totalOutput = Math.round(section?.totalOutputMW || 0).toLocaleString();

  return (
    <div className="pt-2 pb-1 border-b border-slate-200 mb-1.5 flex items-baseline justify-between gap-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-bold tracking-tight text-slate-900">
          {section.title}
        </h2>
        <span className="text-[11px] text-slate-500 font-normal">
          {viewMode === 'generator'
            ? `${section.unitsCount} generators (${section.facilitiesCount} facilities) · `
            : `${section.facilitiesCount} ${section.facilitiesCount === 1 ? 'facility' : 'facilities'} · ${section.unitsCount} units · `
          }
          <strong className="font-semibold text-slate-700">{totalOutput} MW</strong>
        </span>
      </div>
    </div>
  );
}
