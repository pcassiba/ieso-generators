import React from 'react';
import { Atom, Flame, Waves, Wind, BatteryCharging, Sparkles, BarChart2, Gauge, ShieldCheck, Zap } from 'lucide-react';
import { SECTION_KEYS } from '../utils/iesoParser';

const FUEL_ICONS = {
  'Nuclear': Atom,
  'Gas': Flame,
  'Hydro': Waves,
  'Wind': Wind,
  'Batteries': BatteryCharging,
  'Other': Sparkles
};

const FUEL_BAR_COLORS = {
  'Nuclear': 'bg-blue-600',
  'Gas': 'bg-orange-500',
  'Hydro': 'bg-cyan-600',
  'Wind': 'bg-emerald-500',
  'Batteries': 'bg-purple-600',
  'Other': 'bg-slate-600'
};

const FUEL_TEXT_COLORS = {
  'Nuclear': 'text-blue-600',
  'Gas': 'text-orange-600',
  'Hydro': 'text-cyan-600',
  'Wind': 'text-emerald-600',
  'Batteries': 'text-purple-600',
  'Other': 'text-slate-600'
};

export default function MixUtilization({ data, onSelectFacility }) {
  if (!data || !data.sections) return null;

  // Process fuel type statistics
  const fuelStats = [];
  let grandTotalOutputMW = 0;
  let grandTotalCapabilityMW = 0;

  data.sections.forEach(section => {
    const secKey = section.key;
    const outputMW = section.totalOutputMW || 0;
    const capMW = section.totalCapabilityMW || 0;

    grandTotalOutputMW += outputMW;
    grandTotalCapabilityMW += capMW;

    fuelStats.push({
      key: secKey,
      title: section.title,
      outputMW,
      capabilityMW: capMW,
      utilizationPercent: capMW > 0 ? (outputMW / capMW) * 100 : 0,
      spareCapabilityMW: Math.max(0, capMW - outputMW),
      facilitiesCount: section.facilitiesCount || 0,
      unitsCount: section.unitsCount || 0,
      firstFacility: section.facilities?.[0]?.name
    });
  });

  // Calculate share of total generation for each fuel type
  fuelStats.forEach(item => {
    item.sharePercent = grandTotalOutputMW > 0 ? (item.outputMW / grandTotalOutputMW) * 100 : 0;
  });

  // Sort strictly by current output MW descending
  fuelStats.sort((a, b) => b.outputMW - a.outputMW);

  const maxFuelOutputMW = Math.max(...fuelStats.map(f => f.outputMW), 1);

  // Quick Answers / Insights
  const topContributor = fuelStats[0];

  const sortedBySpare = [...fuelStats].sort((a, b) => b.spareCapabilityMW - a.spareCapabilityMW);
  const mostSpare = sortedBySpare[0];

  const sortedByUtilization = [...fuelStats].sort((a, b) => b.utilizationPercent - a.utilizationPercent);
  const highestUtilization = sortedByUtilization[0];

  const overallGridUtilization = grandTotalCapabilityMW > 0
    ? (grandTotalOutputMW / grandTotalCapabilityMW) * 100
    : 0;

  return (
    <div class="space-y-4 pt-0.5">
      {/* Top Banner: Ontario Total Generation */}
      <div class="bg-slate-50 border border-slate-200/90 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-slate-900 text-sm tracking-tight">
              Ontario Generation: <span class="text-blue-700">{grandTotalOutputMW.toLocaleString()} MW</span>
            </span>
            <span class="text-slate-300">•</span>
            <span class="text-slate-500 font-medium">
              Total Capability: {grandTotalCapabilityMW.toLocaleString()} MW
            </span>
          </div>
          <p class="text-[11px] text-slate-500 font-normal">
            Grid Output & Utilization Summary across all reported Ontario fuel sources.
          </p>
        </div>

        <div class="flex items-center gap-2 text-[11px] font-mono font-bold bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
          <Gauge class="w-3.5 h-3.5 text-blue-600" />
          <span class="text-slate-600 font-sans font-medium">Grid Utilization:</span>
          <span class="text-slate-900">{overallGridUtilization.toFixed(1)}%</span>
        </div>
      </div>

      {/* Quick Insights Cards (Answers the 4 key questions immediately) */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Card 1: Top Contributor */}
        <div class="p-2.5 bg-blue-50/50 border border-blue-200/80 rounded-md space-y-1">
          <div class="text-[10.5px] font-bold text-blue-900 uppercase tracking-tight flex items-center justify-between">
            <span>Top Contributor</span>
            <Zap class="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div class="font-extrabold text-slate-900 text-sm">
            {topContributor?.title} ({topContributor?.outputMW.toLocaleString()} MW)
          </div>
          <div class="text-[11px] text-slate-500">
            Produces <strong class="text-blue-700">{topContributor?.sharePercent.toFixed(1)}%</strong> of Ontario power right now
          </div>
        </div>

        {/* Card 2: Most Spare Capability */}
        <div class="p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-md space-y-1">
          <div class="text-[10.5px] font-bold text-emerald-900 uppercase tracking-tight flex items-center justify-between">
            <span>Most Spare Capability</span>
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div class="font-extrabold text-slate-900 text-sm">
            {mostSpare?.title} ({mostSpare?.spareCapabilityMW.toLocaleString()} MW)
          </div>
          <div class="text-[11px] text-slate-500">
            Running at <strong class="text-emerald-700">{mostSpare?.utilizationPercent.toFixed(1)}%</strong> of available capability
          </div>
        </div>

        {/* Card 3: Highest Utilization */}
        <div class="p-2.5 bg-amber-50/50 border border-amber-200/80 rounded-md space-y-1">
          <div class="text-[10.5px] font-bold text-amber-900 uppercase tracking-tight flex items-center justify-between">
            <span>Closest to Max Capability</span>
            <Gauge class="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div class="font-extrabold text-slate-900 text-sm">
            {highestUtilization?.title} ({highestUtilization?.utilizationPercent.toFixed(1)}%)
          </div>
          <div class="text-[11px] text-slate-500">
            Only <strong class="text-amber-800">{highestUtilization?.spareCapabilityMW.toLocaleString()} MW</strong> spare capability remaining
          </div>
        </div>
      </div>

      {/* Main Visual Section: Horizontal Ranked Bar Chart */}
      <div class="space-y-3">
        <div class="pt-1 pb-1 border-b border-slate-200 flex items-baseline justify-between">
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
            <BarChart2 class="w-3.5 h-3.5 text-slate-500" />
            <span>Generation Mix & Capability Utilization</span>
          </h3>
          <span class="text-[11px] text-slate-500 font-medium">
            Sorted by MW output descending
          </span>
        </div>

        <div class="space-y-2.5">
          {fuelStats.map((item, idx) => {
            const IconComponent = FUEL_ICONS[item.title] || Sparkles;
            const barWidthPercent = (item.outputMW / maxFuelOutputMW) * 100;
            const barColor = FUEL_BAR_COLORS[item.title] || 'bg-slate-600';
            const textColor = FUEL_TEXT_COLORS[item.title] || 'text-slate-600';

            const handleRowClick = () => {
              if (onSelectFacility && item.firstFacility) {
                onSelectFacility(item.firstFacility);
              }
            };

            return (
              <div
                key={item.key}
                onClick={handleRowClick}
                class="p-3 bg-white hover:bg-slate-50/80 rounded-lg border border-slate-200/90 transition-colors shadow-2xs cursor-pointer select-none space-y-2"
              >
                {/* Row Header: Icon, Name, Output MW, Share % */}
                <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-mono font-bold text-slate-400 w-4 shrink-0">
                      #{idx + 1}
                    </span>
                    <div class="p-1 rounded bg-slate-100 shrink-0">
                      <IconComponent class={`w-4 h-4 ${textColor}`} />
                    </div>
                    <h4 class="font-bold text-slate-900 text-sm tracking-tight">
                      {item.title}
                    </h4>
                  </div>

                  {/* Share of Ontario Generation Badge */}
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.sharePercent.toFixed(1)}% of Ontario generation
                    </span>
                  </div>
                </div>

                {/* Metrics Line */}
                <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-normal text-slate-600 pt-0.5">
                  <div>
                    <strong class="text-slate-900 font-mono font-bold">{item.outputMW.toLocaleString()} MW</strong> output
                  </div>

                  <div class="text-slate-500 font-mono">
                    <span>{item.capabilityMW.toLocaleString()} MW cap</span>
                    <span class="mx-1 text-slate-300">·</span>
                    <strong class="text-slate-800 font-bold">{item.utilizationPercent.toFixed(1)}% utilized</strong>
                  </div>
                </div>

                {/* Main Horizontal Output Bar */}
                <div class="space-y-1">
                  <div class="w-full bg-slate-100 rounded-full h-3 flex items-center overflow-hidden border border-slate-200/60 p-0.5">
                    <div
                      style={{ width: `${Math.max(barWidthPercent, 1.5)}%` }}
                      class={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    ></div>
                  </div>
                </div>

                {/* Secondary Capability Utilization Indicator */}
                <div class="pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-500">
                  <div class="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span class="font-medium text-slate-600 shrink-0">Capability Utilized:</span>
                    <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                      <div
                        style={{ width: `${Math.max(item.utilizationPercent, 1)}%` }}
                        class={`h-full ${item.utilizationPercent > 90 ? 'bg-amber-500' : 'bg-slate-700'}`}
                      ></div>
                    </div>
                    <span class="font-mono font-semibold text-slate-700 shrink-0">
                      {item.utilizationPercent.toFixed(1)}%
                    </span>
                  </div>

                  <div class="font-mono text-slate-600">
                    Spare: <strong class="text-emerald-700 font-bold">{item.spareCapabilityMW.toLocaleString()} MW</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
