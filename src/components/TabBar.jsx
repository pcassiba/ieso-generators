import React from 'react';
import { LayoutList, PieChart } from 'lucide-react';

export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <div class="border-b border-slate-200 mb-4 flex items-center gap-6 text-xs font-medium">
      <button
        onClick={() => onSelectTab('summary')}
        class={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
          activeTab === 'summary'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutList class="w-3.5 h-3.5" />
        <span>Summary</span>
      </button>

      <button
        onClick={() => onSelectTab('visual')}
        class={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
          activeTab === 'visual'
            ? 'border-blue-600 text-blue-600 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <PieChart class="w-3.5 h-3.5" />
        <span>Visual Summary</span>
      </button>
    </div>
  );
}
