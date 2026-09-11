import React from 'react';
import { Activity, Gauge, CheckCircle2, PauseCircle, AlertOctagon, Layers } from 'lucide-react';

export default function SummaryCards({
  totalOutput,
  totalCapability,
  capacityFactor,
  onlineCount,
  idleCount,
  outageCount,
  totalUnits
}) {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {/* Total Output Card */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-colors"></div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Ontario Output</span>
          <div class="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Activity class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-white tracking-tight font-mono">
            {totalOutput.toLocaleString()}
          </span>
          <span class="text-sm font-semibold text-cyan-400">MW</span>
        </div>
        <p class="mt-2 text-xs text-slate-400">Current active generation across Ontario</p>
      </div>

      {/* Total Capability Card */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Capability</span>
          <div class="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <Gauge class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-white tracking-tight font-mono">
            {totalCapability.toLocaleString()}
          </span>
          <span class="text-sm font-semibold text-blue-400">MW</span>
        </div>
        <p class="mt-2 text-xs text-slate-400">Maximum available generation capacity</p>
      </div>

      {/* Capacity Factor Card */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Ontario Capacity Factor</span>
          <div class="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Layers class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-white tracking-tight font-mono">
            {capacityFactor.toFixed(1)}%
          </span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
          <div
            class="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(capacityFactor, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Unit Status Breakdown Card */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Unit Status Overview</span>
          <span class="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-800 rounded text-slate-300">
            {totalUnits} Units
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2 mt-3 text-center">
          <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2">
            <div class="flex items-center justify-center gap-1 text-emerald-400 text-xs font-medium">
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>Online</span>
            </div>
            <span class="text-lg font-bold text-white font-mono mt-1 block">{onlineCount}</span>
          </div>
          <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
            <div class="flex items-center justify-center gap-1 text-amber-400 text-xs font-medium">
              <PauseCircle class="w-3.5 h-3.5" />
              <span>Idle</span>
            </div>
            <span class="text-lg font-bold text-white font-mono mt-1 block">{idleCount}</span>
          </div>
          <div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2">
            <div class="flex items-center justify-center gap-1 text-rose-400 text-xs font-medium">
              <AlertOctagon class="w-3.5 h-3.5" />
              <span>Outage</span>
            </div>
            <span class="text-lg font-bold text-white font-mono mt-1 block">{outageCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
