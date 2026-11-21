import React from 'react';

export default function Sparkline({ dataPoints = [], width = 320, height = 44, color = '#2563eb' }) {
  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div class="h-10 flex items-center justify-center text-slate-400 text-[11px] italic">
        No hourly data available
      </div>
    );
  }

  // Missing hours stay as gaps in the line; they are never drawn as 0 MW
  const validPoints = dataPoints.map(v => (typeof v === 'number' && !isNaN(v)) ? v : null);
  const reported = validPoints.filter(v => v !== null);
  if (reported.length === 0) {
    return (
      <div class="h-10 flex items-center justify-center text-slate-400 text-[11px] italic">
        No hourly data available
      </div>
    );
  }
  const minVal = Math.min(...reported);
  const maxVal = Math.max(...reported);
  const range = maxVal - minVal;

  const paddingX = 6;
  const paddingY = 6;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const xAt = (idx) => validPoints.length > 1
    ? paddingX + (idx / (validPoints.length - 1)) * chartWidth
    : width / 2;
  const yAt = (val) => range > 0
    ? height - paddingY - ((val - minVal) / range) * chartHeight
    : height / 2;

  const points = validPoints
    .map((val, idx) => (val === null ? null : { x: xAt(idx), y: yAt(val), val }));

  // Split into runs of consecutive reported hours
  const runs = [];
  let run = [];
  points.forEach(p => {
    if (p === null) { if (run.length) runs.push(run); run = []; }
    else run.push(p);
  });
  if (run.length) runs.push(run);

  const pathD = runs
    .map(r => r.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '))
    .join(' ');
  const areaD = runs
    .map(r => {
      const line = r.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      return `${line} L ${r[r.length - 1].x.toFixed(1)} ${height - 2} L ${r[0].x.toFixed(1)} ${height - 2} Z`;
    })
    .join(' ');

  const lastP = runs.length ? runs[runs.length - 1][runs[runs.length - 1].length - 1] : null;

  const gradientId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div class="w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        class="w-full h-11 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Soft background fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Main Sparkline Stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Highlight dot on the current / latest point */}
        {lastP && (
          <circle
            cx={lastP.x}
            cy={lastP.y}
            r="2.5"
            fill={color}
            stroke="#ffffff"
            strokeWidth="1"
          />
        )}
      </svg>
    </div>
  );
}
