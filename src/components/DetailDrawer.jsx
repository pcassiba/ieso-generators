import React, { useEffect } from 'react';
import { X, Atom, Flame, Waves, Wind, BatteryCharging, Sparkles, Zap, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { SECTION_KEYS } from '../utils/iesoParser';

const FUEL_ICONS = {
  'Nuclear': Atom,
  'Gas': Flame,
  'Hydro': Waves,
  'Wind': Wind,
  'Batteries': BatteryCharging,
  'Other': Sparkles
};

export default function DetailDrawer({ selectedDetail, onClose, data }) {
  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedDetail || !data) return null;

  // Resolve target facility and target unit from data
  let targetFacility = null;
  let targetUnit = null;

  if (selectedDetail.type === 'facility') {
    const facName = typeof selectedDetail.facility === 'string'
      ? selectedDetail.facility
      : selectedDetail.facility?.name;

    for (const sec of data.sections) {
      const found = sec.facilities?.find(f => f.name === facName);
      if (found) {
        targetFacility = found;
        break;
      }
    }
  } else if (selectedDetail.type === 'generator') {
    const unitName = typeof selectedDetail.unit === 'string'
      ? selectedDetail.unit
      : selectedDetail.unit?.genName;

    for (const sec of data.sections) {
      for (const fac of sec.facilities || []) {
        const foundU = fac.units?.find(u => u.genName === unitName);
        if (foundU) {
          targetUnit = foundU;
          targetFacility = fac;
          break;
        }
      }
      if (targetFacility) break;
    }
  }

  if (!targetFacility) return null;

  const fuelCategory = targetFacility.sectionKey || 'Other';
  const IconComponent = FUEL_ICONS[fuelCategory] || Sparkles;

  const totalOutput = targetFacility.totalOutputMW || 0;
  const totalCap = targetFacility.installedRatingMW || targetFacility.totalCapabilityMW || 0;
  const utilization = totalCap > 0 ? (totalOutput / totalCap) * 100 : 0;

  const onlineUnits = targetFacility.units.filter(u => u.status === 'online');
  const idleUnits = targetFacility.units.filter(u => u.status === 'idle');
  const outageUnits = targetFacility.units.filter(u => u.status === 'outage');

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        class="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 transition-opacity"
      ></div>

      {/* Slide-in Detail Panel */}
      <div class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-200 ease-out">
        {/* Header */}
        <div class="p-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/80">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                <IconComponent class="w-3.5 h-3.5 text-blue-600" />
                <span>{targetFacility.sectionKey}</span>
              </span>
              {targetUnit && (
                <span class="text-[11px] font-mono font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                  {targetUnit.genName}
                </span>
              )}
            </div>

            <h2 class="text-lg font-extrabold text-slate-900 tracking-tight truncate">
              {targetFacility.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors shrink-0"
            title="Close Drawer (Esc)"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div class="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Target Generator Focused Header (if user clicked an individual unit) */}
          {targetUnit && (
            <div class="bg-blue-50/80 border border-blue-200 rounded-lg p-3 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <Zap class="w-4 h-4 text-blue-600 shrink-0" />
                  <span class="font-bold text-slate-900 text-sm">
                    {targetUnit.genName}
                  </span>
                </div>

                <span class={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  targetUnit.status === 'online' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  targetUnit.status === 'idle' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {targetUnit.statusLabel}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-slate-700 font-mono text-xs pt-1 border-t border-blue-200/60">
                <div>
                  <span class="text-[10px] text-slate-500 font-sans block uppercase">Current Output</span>
                  <strong class="text-sm text-slate-900">{targetUnit.outputMW.toLocaleString()} MW</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 font-sans block uppercase">Capability</span>
                  <strong class="text-sm text-slate-900">{targetUnit.capabilityMW.toLocaleString()} MW</strong>
                </div>
              </div>
            </div>
          )}

          {/* Facility Overall Performance Box */}
          <div class="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 uppercase text-[11px] tracking-tight">
                Facility Summary
              </span>
              <span class="text-slate-500 text-[11px] font-mono">
                {targetFacility.units.length} total units
              </span>
            </div>

            {/* Metrics Grid */}
            <div class="grid grid-cols-3 gap-2 py-1 text-center font-mono border-y border-slate-200/80">
              <div class="p-1.5 bg-white rounded border border-slate-100">
                <span class="text-[9.5px] text-slate-400 font-sans uppercase block">Output</span>
                <span class="font-bold text-slate-900 text-sm block leading-tight">
                  {totalOutput.toLocaleString()}
                </span>
                <span class="text-[9px] text-slate-400 font-sans">MW</span>
              </div>

              <div class="p-1.5 bg-white rounded border border-slate-100">
                <span class="text-[9.5px] text-slate-400 font-sans uppercase block">Capability</span>
                <span class="font-bold text-slate-900 text-sm block leading-tight">
                  {totalCap.toLocaleString()}
                </span>
                <span class="text-[9px] text-slate-400 font-sans">MW</span>
              </div>

              <div class="p-1.5 bg-white rounded border border-slate-100">
                <span class="text-[9.5px] text-slate-400 font-sans uppercase block">Utilized</span>
                <span class="font-bold text-blue-700 text-sm block leading-tight">
                  {utilization.toFixed(1)}%
                </span>
                <span class="text-[9px] text-slate-400 font-sans">capacity</span>
              </div>
            </div>

            {/* Unit Status Breakdown Pills */}
            <div class="flex items-center justify-around gap-2 text-[11px]">
              <div class="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                <span>{onlineUnits.length} Online</span>
              </div>

              <div class="flex items-center gap-1.5 text-amber-800 font-medium">
                <Clock class="w-3.5 h-3.5 text-amber-500" />
                <span>{idleUnits.length} Idle</span>
              </div>

              <div class="flex items-center gap-1.5 text-rose-800 font-medium">
                <AlertTriangle class="w-3.5 h-3.5 text-rose-600" />
                <span>{outageUnits.length} Outage</span>
              </div>
            </div>
          </div>

          {/* Generator Units Breakdown */}
          <div>
            <div class="pt-1 pb-1.5 border-b border-slate-200 mb-2 flex items-baseline justify-between">
              <h3 class="font-bold text-slate-900 uppercase text-[11px] tracking-tight">
                Generators / Units ({targetFacility.units.length})
              </h3>
              <span class="text-[10.5px] text-slate-400 font-mono">
                {targetFacility.name}
              </span>
            </div>

            <div class="space-y-1.5">
              {targetFacility.units.map((unit) => {
                const isSelected = targetUnit && targetUnit.genName === unit.genName;

                let dotBg = 'bg-emerald-500';
                let statusBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';

                if (unit.status === 'idle') {
                  dotBg = 'bg-amber-400';
                  statusBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                } else if (unit.status === 'outage') {
                  dotBg = 'bg-rose-500';
                  statusBadgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
                }

                return (
                  <div
                    key={unit.genName}
                    class={`p-2 rounded-md border flex items-center justify-between gap-3 text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-300 ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {/* Left: Unit Name & Status */}
                    <div class="flex items-center gap-2 min-w-0">
                      <span class={`w-2 h-2 rounded-full shrink-0 ${dotBg}`}></span>
                      <div>
                        <div class="font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                          <span>{unit.shortLabel}</span>
                          <span class="text-[10px] text-slate-400 font-mono font-normal truncate">
                            ({unit.genName})
                          </span>
                        </div>
                        <span class={`inline-block text-[9.5px] font-medium px-1 py-0.2 rounded border mt-0.5 ${statusBadgeStyle}`}>
                          {unit.statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Right: Output & Capability MW */}
                    <div class="text-right font-mono shrink-0">
                      <div class="font-bold text-slate-900">
                        {unit.outputMW.toLocaleString()} MW
                      </div>
                      <div class="text-[10px] text-slate-400 font-sans">
                        of {unit.capabilityMW.toLocaleString()} MW cap
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div class="p-3 border-t border-slate-200 bg-slate-50 text-center text-[10.5px] text-slate-400">
          Click anywhere outside or press ESC to close detail drawer
        </div>
      </div>
    </>
  );
}
