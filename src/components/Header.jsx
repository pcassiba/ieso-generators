import React from 'react';
import { RefreshCw, ArrowDownWideNarrow, Calendar, Clock, History, Check, Layers, Cpu } from 'lucide-react';

export default function Header({
  createdAt,
  lastRefreshed,
  isRefreshing,
  onRefresh,
  sortBy,
  onSortChange,
  viewMode = 'facility',
  onViewModeChange,
  isLiveMode,
  onToggleLiveMode,
  selectedDate,
  onSelectDate,
  selectedVersion,
  onSelectVersion,
  availableDates,
  availableVersions,
  nextRefreshTimeStr
}) {
  const formattedCreated = createdAt
    ? new Date(createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'N/A';

  return (
    <header class="py-2 mb-3 border-b border-slate-200 space-y-2 text-xs">
      {/* Top Main Row: Title, Mode Indicator & Live Controls */}
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Title & Live Status */}
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="font-bold text-slate-900 tracking-tight text-sm">
            IESO Ontario Generation Summary
          </h1>

          <span class="text-slate-300">•</span>

          {/* Live vs Archive Badge */}
          {isLiveMode ? (
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live (Auto-refresh at :20 past hour)</span>
            </span>
          ) : (
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
              <History class="w-3 h-3 text-amber-600" />
              <span>Archive Report ({selectedDate} v{selectedVersion})</span>
            </span>
          )}
        </div>

        {/* Right Controls: Mode Switch, Sort & Refresh */}
        <div class="flex items-center gap-2.5 text-[11px] text-slate-600 flex-wrap">
          {/* Live vs Archive Mode Toggle */}
          <div class="flex items-center rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => onToggleLiveMode(true)}
              class={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                isLiveMode
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Live</span>
            </button>

            <button
              onClick={() => onToggleLiveMode(false)}
              class={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                !isLiveMode
                  ? 'bg-white text-amber-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar class="w-3 h-3" />
              <span>Archive</span>
            </button>
          </div>

          {/* View Mode Toggle: Facility vs Generator */}
          <div class="flex items-center rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => onViewModeChange && onViewModeChange('facility')}
              class={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'facility'
                  ? 'bg-white text-blue-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Group generators by facility"
            >
              <Layers class="w-3 h-3 text-blue-600" />
              <span>Facility View</span>
            </button>
            <button
              onClick={() => onViewModeChange && onViewModeChange('generator')}
              class={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'generator'
                  ? 'bg-white text-purple-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Show individual generator units"
            >
              <Cpu class="w-3 h-3 text-purple-600" />
              <span>Generator View</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div class="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
            <ArrowDownWideNarrow class="w-3 h-3 text-slate-400" />
            <span class="text-slate-400 font-medium">Sort:</span>
            <button
              onClick={() => onSortChange('capability')}
              class={`px-1.5 py-0.5 rounded transition-colors ${
                sortBy === 'capability'
                  ? 'bg-white text-slate-900 font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Capability ↓
            </button>
            <button
              onClick={() => onSortChange('output')}
              class={`px-1.5 py-0.5 rounded transition-colors ${
                sortBy === 'output'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sort facilities by current output MW descending"
            >
              Output ↓
            </button>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Data"
            class="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw class={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Historical Report Selectors Bar (Visible in Archive mode or expandable) */}
      {!isLiveMode && (
        <div class="bg-amber-50/60 border border-amber-200/80 rounded px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2 text-amber-900 font-medium">
            <Calendar class="w-3.5 h-3.5 text-amber-600" />
            <span>Select Historical Report:</span>
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            {/* Date Select Dropdown */}
            <div class="flex items-center gap-1.5">
              <label class="text-slate-600 text-[11px] font-medium">Date:</label>
              <select
                value={selectedDate || ''}
                onChange={(e) => onSelectDate(e.target.value)}
                class="bg-white border border-slate-300 text-slate-800 rounded px-2 py-1 text-xs font-mono font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                {availableDates && availableDates.length > 0 ? (
                  availableDates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))
                ) : (
                  <option value={selectedDate}>{selectedDate}</option>
                )}
              </select>
            </div>

            {/* Version Select Dropdown */}
            <div class="flex items-center gap-1.5">
              <label class="text-slate-600 text-[11px] font-medium">Version:</label>
              <select
                value={selectedVersion || ''}
                onChange={(e) => onSelectVersion(parseInt(e.target.value, 10))}
                class="bg-white border border-slate-300 text-slate-800 rounded px-2 py-1 text-xs font-mono font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                {availableVersions && availableVersions.length > 0 ? (
                  availableVersions.map(v => (
                    <option key={v} value={v}>v{v}</option>
                  ))
                ) : (
                  <option value={selectedVersion}>v{selectedVersion}</option>
                )}
              </select>
            </div>

            {/* Back to Live button */}
            <button
              onClick={() => onToggleLiveMode(true)}
              class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-[11px] transition-colors"
            >
              Switch to Live
            </button>
          </div>
        </div>
      )}

      {/* Timestamp & Status Legend Row */}
      <div class="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2 pt-0.5">
        <div>
          <span>Report Timestamp: <strong class="text-slate-700 font-medium">{formattedCreated}</strong></span>
          {isLiveMode && nextRefreshTimeStr && (
            <span class="ml-2 text-emerald-700">
              (Next auto-refresh at <strong>{nextRefreshTimeStr}</strong>)
            </span>
          )}
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Online</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Idle</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Outage</span>
          </div>
        </div>
      </div>
    </header>
  );
}
