import React from 'react';
import { LayoutList, PieChart, AlertTriangle, AlertOctagon, BarChart2, TrendingUp } from 'lucide-react';

export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <div class="border-b border-slate-200 mb-3 flex items-center gap-4 sm:gap-6 text-xs font-medium overflow-x-auto">
      <button
        onClick={() => onSelectTab('summary')}
        class={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'summary'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutList class="w-3.5 h-3.5" />
        <span>Generation Summary</span>
      </button>

      <button
        onClick={() => onSelectTab('visual')}
        class={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'visual'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <PieChart class="w-3.5 h-3.5" />
        <span>Generation Visualization</span>
      </button>

      <button
        onClick={() => onSelectTab('movements')}
        class={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'movements'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <TrendingUp class="w-3.5 h-3.5 text-blue-600" />
        <span>Movements</span>
      </button>

      <button
        onClick={() => onSelectTab('mix_utilization')}
        class={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'mix_utilization'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <BarChart2 class="w-3.5 h-3.5 text-blue-600" />
        <span>Mix & Utilization</span>
      </button>

      <button
        onClick={() => onSelectTab('outages')}
        class={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'outages'
            ? 'border-rose-600 text-rose-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-rose-700'
        }`}
      >
        <AlertTriangle class="w-3.5 h-3.5 text-rose-500" />
        <span>Outages</span>
      </button>

      <button
        onClick={() => onSelectTab('outage_visual')}
        class={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'outage_visual'
            ? 'border-rose-600 text-rose-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-rose-700'
        }`}
      >
        <AlertOctagon class="w-3.5 h-3.5 text-rose-500" />
        <span>Outage Visualization</span>
      </button>
    </div>
  );
}
