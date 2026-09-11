import React from 'react';

export default function Sparkline({ dataPoints = [], width = 320, height = 44, color = '#2563eb' }) {
  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div class="h-10 flex items-center justify-center text-slate-400 text-[11px] italic">
        No hourly data available
      </div>
    );
  }

  const validPoints = dataPoints.map(v => (typeof v === 'number' && !isNaN(v)) ? v : 0);
  const minVal = Math.min(...validPoints);
  const maxVal = Math.max(...validPoints);
  const range = maxVal - minVal;

  const paddingX = 6;
  const paddingY = 6;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = validPoints.map((val, idx) => {
    const x = validPoints.length > 1
      ? paddingX + (idx / (validPoints.length - 1)) * chartWidth
      : width / 2;

    const y = range > 0
      ? height - paddingY - ((val - minVal) / range) * chartHeight
      : height / 2;

    return { x, y, val };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  
  const firstP = points[0];
  const lastP = points[points.length - 1];
  const areaD = `${pathD} L ${lastP.x.toFixed(1)} ${height - 2} L ${firstP.x.toFixed(1)} ${height - 2} Z`;

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
