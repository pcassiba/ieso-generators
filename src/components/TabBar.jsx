import React from 'react';
import { LayoutList, PieChart, AlertTriangle, AlertOctagon, BarChart2, TrendingUp, Wind } from 'lucide-react';

export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <div className="border-b border-slate-200 mb-3 flex items-center gap-4 sm:gap-6 text-xs font-medium overflow-x-auto">
      <button
        onClick={() => onSelectTab('summary')}
        className={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'summary'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutList className="w-3.5 h-3.5" />
        <span>Generation</span>
      </button>

      <button
        onClick={() => onSelectTab('visual')}
        className={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'visual'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <PieChart className="w-3.5 h-3.5" />
        <span>Ranking</span>
      </button>

      <button
        onClick={() => onSelectTab('movements')}
        className={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'movements'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
        <span>Changes</span>
      </button>

      <button
        onClick={() => onSelectTab('mix_utilization')}
        className={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'mix_utilization'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
        <span>Trends</span>
      </button>

      <button
        onClick={() => onSelectTab('wind_outlook')}
        className={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'wind_outlook'
            ? 'border-emerald-600 text-emerald-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <Wind className="w-3.5 h-3.5 text-emerald-600" />
        <span>Wind Outlook</span>
      </button>

      <button
        onClick={() => onSelectTab('outages')}
        className={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'outages'
            ? 'border-rose-600 text-rose-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-rose-700'
        }`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
        <span>Outages</span>
      </button>

      <button
        onClick={() => onSelectTab('outage_visual')}
        className={`pb-2 flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap ${
          activeTab === 'outage_visual'
            ? 'border-rose-600 text-rose-700 font-bold'
            : 'border-transparent text-slate-500 hover:text-rose-700'
        }`}
      >
        <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
        <span>Outage Ranking</span>
      </button>
    </div>
  );
}
