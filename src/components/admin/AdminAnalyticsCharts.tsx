import React, { useId } from 'react';

export const AnalyticsLineChart: React.FC<{
  data: Array<{ date: string; value: number }>;
  valueLabel: string;
  color?: string;
}> = ({ data, valueLabel, color = '#22D3EE' }) => {
  const gradientId = useId().replace(/:/g, '');
  const width = 720;
  const height = 220;
  const pad = 26;
  const max = Math.max(1, ...data.map((item) => Number.isFinite(item.value) ? item.value : 0));
  const points = data.map((item, index) => ({
    ...item,
    x: pad + index * (width - pad * 2) / Math.max(data.length - 1, 1),
    y: height - pad - (item.value / max) * (height - pad * 2),
  }));
  const line = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return <div className="mt-5">
    <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-[#080D18]/75 p-2 sm:p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-h-48 w-full" role="img" aria-label={valueLabel}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        {[0, 1, 2, 3].map((row) => <line key={row} x1={pad} x2={width-pad} y1={pad+row*(height-pad*2)/3} y2={pad+row*(height-pad*2)/3} stroke="#334155" strokeDasharray="4 8" opacity=".6"/>)}
        <polygon points={area} fill={`url(#${gradientId})`}/><polyline points={line} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        {points.map((point, index) => <g key={point.date}><title>{`${point.date}: ${point.value}`}</title><circle cx={point.x} cy={point.y} r={index === points.length-1 ? 4 : 2.5} fill="#080D18" stroke={color} strokeWidth="2"/></g>)}
      </svg>
    </div>
    <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500"><span>{data[0]?.date ?? '-'}</span><span>{data.at(-1)?.date ?? '-'}</span></div>
  </div>;
};

export const AnalyticsBarChart: React.FC<{
  data: Array<{ label: string; value: number }>;
  suffix?: string;
  colorClass?: string;
}> = ({ data, suffix = '%', colorClass = 'from-cyan-400 to-blue-500' }) => {
  const max = Math.max(1, ...data.map((item) => Number.isFinite(item.value) ? item.value : 0));
  if (!data.length) return <p className="mt-6 rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">ยังไม่มีข้อมูล</p>;
  return <div className="mt-5 space-y-3">
    {data.map((item, index) => <div key={`${item.label}-${index}`}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium text-slate-300" title={item.label}>{item.label}</span><span className="shrink-0 font-mono font-bold text-white">{item.value}{suffix}</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-[width] duration-500`} style={{ width: `${Math.max(0, item.value / max * 100)}%` }}/></div>
    </div>)}
  </div>;
};
