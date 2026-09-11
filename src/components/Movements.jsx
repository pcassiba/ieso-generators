import React, { useState } from 'react';
import { Atom, Flame, Waves, Wind, BatteryCharging, Sparkles, TrendingUp, ArrowUpDown, Layers, Cpu, Filter } from 'lucide-react';
import { SECTION_KEYS } from '../utils/iesoParser';

const FUEL_ICONS = {
  'Nuclear': Atom,
  'Gas': Flame,
  'Hydro': Waves,
  'Wind': Wind,
  'Batteries': BatteryCharging,
  'Other': Sparkles
};

const FUEL_TEXT_COLORS = {
  'Nuclear': 'text-blue-600',
  'Gas': 'text-orange-600',
  'Hydro': 'text-cyan-600',
  'Wind': 'text-emerald-600',
  'Batteries': 'text-purple-600',
  'Other': 'text-slate-600'
};

export default function Movements({ data, onSelectFacility, onSelectGenerator }) {
  const [viewMode, setViewMode] = useState('facility'); // 'facility' | 'generator'
  const [dirFilter, setDirFilter] = useState('all'); // 'all' | 'increasing' | 'decreasing'
  const [fuelFilter, setFuelFilter] = useState('all'); // 'all' | fuelKey

  if (!data || !data.sections) return null;

  const isGeneratorView = viewMode === 'generator';
  const rawItems = [];

  let totalOntarioNetChange = 0;

  data.sections.forEach(section => {
    let sectionFuelKey = section.key;

    (section.facilities || []).forEach(fac => {
      totalOntarioNetChange += (fac.totalMwChange || 0);

      if (isGeneratorView) {
        // Generator level movements
        (fac.units || []).forEach(unit => {
          rawItems.push({
            id: unit.genName,
            displayName: unit.genName,
            facilityName: fac.name,
            fuelCategory: sectionFuelKey,
            sectionKey: section.key,
            outputMW: unit.outputMW || 0,
            prevOutputMW: unit.prevOutputMW,
            mwChange: unit.mwChange || 0,
            pctChange: unit.pctChange || 0,
            absChange: Math.abs(unit.mwChange || 0),
            status: unit.status
          });
        });
      } else {
        // Facility level movements
        rawItems.push({
          id: fac.name,
          displayName: fac.name,
          facilityName: fac.name,
          fuelCategory: sectionFuelKey,
          sectionKey: section.key,
          outputMW: fac.totalOutputMW || 0,
          prevOutputMW: fac.totalPrevOutputMW,
          mwChange: fac.totalMwChange || 0,
          pctChange: fac.totalPctChange || 0,
          absChange: Math.abs(fac.totalMwChange || 0),
          unitsCount: fac.units.length
        });
      }
    });
  });

  // Apply Direction Filter
  let filteredItems = rawItems.filter(item => {
    if (dirFilter === 'increasing') return item.mwChange > 0;
    if (dirFilter === 'decreasing') return item.mwChange < 0;
    return true; // 'all'
  });

  // Apply Fuel Filter
  if (fuelFilter !== 'all') {
    filteredItems = filteredItems.filter(item => item.sectionKey === fuelFilter);
  }

  // Sort strictly by absolute MW change descending (largest movement first)
  filteredItems.sort((a, b) => b.absChange - a.absChange);

  // Assign rank numbers
  const rankedItems = filteredItems.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));

  // Quick stats
  const topIncreaser = [...rawItems].sort((a, b) => b.mwChange - a.mwChange)[0];
  const topDecreaser = [...rawItems].sort((a, b) => a.mwChange - b.mwChange)[0];

  const handleItemClick = (item) => {
    if (isGeneratorView) {
      if (onSelectGenerator) onSelectGenerator(item.displayName);
    } else {
      if (onSelectFacility) onSelectFacility(item.displayName);
    }
  };

  return (
    <div class="space-y-4 pt-0.5">
      {/* Top Banner: Hour-over-Hour Generation Movements */}
      <div class="bg-slate-50 border border-slate-200/90 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-blue-600 shrink-0" />
            <h2 class="font-extrabold text-slate-900 text-sm tracking-tight inline">
              Hour-over-Hour Output Movements
            </h2>
            <span class="text-slate-300">•</span>
            <span class="text-slate-500 font-medium">
              Net Ontario Grid Change: <strong class={`font-mono ${totalOntarioNetChange >= 0 ? 'text-blue-700' : 'text-slate-700'}`}>
                {totalOntarioNetChange >= 0 ? `+${totalOntarioNetChange.toLocaleString()}` : `−${Math.abs(totalOntarioNetChange).toLocaleString()}`} MW
              </strong>
            </span>
          </div>
          <p class="text-[11px] text-slate-500 font-normal">
            Ranked by absolute MW change vs previous hourly snapshot ({data.prevHour ? `Hour ${data.prevHour} → Hour ${data.activeHour}` : `Active Hour ${data.activeHour}`}).
          </p>
        </div>

        {/* Quick Highlights Pills */}
        <div class="flex items-center gap-2 flex-wrap text-[11px] font-mono">
          {topIncreaser && topIncreaser.mwChange > 0 && (
            <div class="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded font-semibold flex items-center gap-1">
              <span>Top Ramp Up:</span>
              <strong class="text-blue-950">{topIncreaser.displayName} (+{topIncreaser.mwChange.toLocaleString()} MW)</strong>
            </div>
          )}

          {topDecreaser && topDecreaser.mwChange < 0 && (
            <div class="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded font-semibold flex items-center gap-1">
              <span>Top Ramp Down:</span>
              <strong class="text-slate-900">{topDecreaser.displayName} (−{Math.abs(topDecreaser.mwChange).toLocaleString()} MW)</strong>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: View Toggle + Filters */}
      <div class="bg-white p-2.5 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: View Mode Toggle (Facility vs Generator) */}
        <div class="flex items-center gap-2">
          <span class="text-slate-500 font-medium text-[11px]">View:</span>
          <div class="flex items-center rounded border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
            <button
              onClick={() => setViewMode('facility')}
              class={`px-2.5 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                !isGeneratorView
                  ? 'bg-white text-blue-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers class="w-3 h-3 text-blue-600" />
              <span>Facility View</span>
            </button>
            <button
              onClick={() => setViewMode('generator')}
              class={`px-2.5 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                isGeneratorView
                  ? 'bg-white text-purple-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu class="w-3 h-3 text-purple-600" />
              <span>Generator View</span>
            </button>
          </div>
        </div>

        {/* Right: Direction & Fuel Filters */}
        <div class="flex items-center gap-3 flex-wrap text-[11px]">
          {/* Movement Direction Filter */}
          <div class="flex items-center gap-1.5">
            <span class="text-slate-400 font-medium">Movement:</span>
            <div class="flex items-center rounded border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setDirFilter('all')}
                class={`px-2 py-0.5 rounded font-medium transition-colors ${
                  dirFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDirFilter('increasing')}
                class={`px-2 py-0.5 rounded font-medium transition-colors ${
                  dirFilter === 'increasing'
                    ? 'bg-white text-blue-900 font-bold shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Increasing (↑)
              </button>
              <button
                onClick={() => setDirFilter('decreasing')}
                class={`px-2 py-0.5 rounded font-medium transition-colors ${
                  dirFilter === 'decreasing'
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Decreasing (↓)
              </button>
            </div>
          </div>

          {/* Fuel Type Dropdown Filter */}
          <div class="flex items-center gap-1.5">
            <span class="text-slate-400 font-medium">Fuel:</span>
            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              class="bg-slate-50 border border-slate-200 text-slate-800 rounded px-2 py-0.5 text-[11px] font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Fuel Types</option>
              <option value={SECTION_KEYS.NUCLEAR}>Nuclear</option>
              <option value={SECTION_KEYS.GAS}>Gas</option>
              <option value={SECTION_KEYS.HYDRO}>Hydro</option>
              <option value={SECTION_KEYS.WIND}>Wind</option>
              <option value={SECTION_KEYS.BATTERIES}>Batteries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div class="space-y-2">
        <div class="pt-1 pb-1 border-b border-slate-200 flex items-baseline justify-between text-xs">
          <h3 class="font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
            <ArrowUpDown class="w-3.5 h-3.5 text-slate-500" />
            <span>
              {isGeneratorView ? 'Generator Output Movements' : 'Facility Output Movements'}
            </span>
          </h3>
          <span class="text-[11px] text-slate-500 font-medium">
            Showing {rankedItems.length} {isGeneratorView ? 'generators' : 'facilities'}
          </span>
        </div>

        {rankedItems.length > 0 ? (
          <div class="space-y-1.5">
            {rankedItems.map((item) => {
              const IconComponent = FUEL_ICONS[item.sectionKey] || Sparkles;
              const textColor = FUEL_TEXT_COLORS[item.sectionKey] || 'text-slate-600';
              const isPos = item.mwChange > 0;
              const isNeg = item.mwChange < 0;

              let badgeStyle = 'bg-slate-50 text-slate-500 border-slate-200';
              let arrowChar = '−';

              if (isPos) {
                badgeStyle = 'bg-blue-50 text-blue-950 border-blue-200/90';
                arrowChar = '↑';
              } else if (isNeg) {
                badgeStyle = 'bg-slate-100 text-slate-900 border-slate-200';
                arrowChar = '↓';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  class="py-2 px-3 bg-white hover:bg-slate-50/90 rounded-lg border border-slate-200/90 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer select-none shadow-2xs"
                >
                  {/* Left: Rank, Fuel Icon, Name & Facility Context */}
                  <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <span class="text-[10.5px] font-mono font-bold text-slate-400 w-6 shrink-0">
                      #{item.rank}
                    </span>

                    <div class="p-1 rounded bg-slate-100 shrink-0">
                      <IconComponent class={`w-4 h-4 ${textColor}`} />
                    </div>

                    <div class="min-w-0 truncate">
                      <h4 class="font-bold text-slate-900 text-xs tracking-tight truncate leading-tight hover:text-blue-600 transition-colors">
                        {item.displayName}
                      </h4>
                      {isGeneratorView && (
                        <span class="text-[10px] text-slate-400 font-medium block truncate">
                          Facility: {item.facilityName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Output MW & Prominent Movement Badge */}
                  <div class="flex items-center gap-3 shrink-0 font-mono text-right">
                    <div>
                      <span class="text-[10px] text-slate-400 font-sans block leading-none">Current</span>
                      <span class="font-bold text-slate-900 text-xs block leading-tight">
                        {item.outputMW.toLocaleString()} MW
                      </span>
                    </div>

                    {/* Movement Delta Badge */}
                    <div class={`px-2.5 py-1 rounded-md font-bold font-mono text-xs flex items-center gap-1 min-w-[95px] justify-center border ${badgeStyle}`}>
                      <span class="font-extrabold">{arrowChar}</span>
                      <span>
                        {isPos ? `+${item.mwChange.toLocaleString()}` : isNeg ? `−${Math.abs(item.mwChange).toLocaleString()}` : '0'} MW
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div class="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded border border-slate-200">
            No movements matching the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
