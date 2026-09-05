import React, { useId } from 'react';
import type { AdminDashboardData } from '../../types';

interface AdminActivityChartProps {
  data: AdminDashboardData['activityTrend'];
  language: 'th' | 'en';
}

export const AdminActivityChart: React.FC<AdminActivityChartProps> = ({ data, language }) => {
  const gradientId = useId().replace(/:/g, '');
  const width = 760;
  const height = 220;
  const insetX = 24;
  const insetY = 22;
  const maxValue = Math.max(1, ...data.map((item) => item.events));
  const points = data.map((item, index) => {
    const x = insetX + (index * (width - insetX * 2)) / Math.max(data.length - 1, 1);
    const y = height - insetY - (item.events / maxValue) * (height - insetY * 2);
    return { x, y, ...item };
  });
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const areaPoints = `${insetX},${height - insetY} ${linePoints} ${width - insetX},${height - insetY}`;

  return (
    <div>
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-slate-700/60 bg-[#080D18]/75 px-2 pb-2 pt-4 sm:px-4">
        <svg className="h-auto min-h-48 w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={language === 'th' ? 'แนวโน้มกิจกรรมผู้ใช้ 7 วันล่าสุด' : 'User activity trend over the last 7 days'}>
          <title>{language === 'th' ? 'แนวโน้มกิจกรรมผู้ใช้' : 'User activity trend'}</title>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((row) => {
            const y = insetY + row * ((height - insetY * 2) / 3);
            return <line key={row} x1={insetX} x2={width - insetX} y1={y} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 8" opacity="0.55" />;
          })}
          <polygon points={areaPoints} fill={`url(#${gradientId})`} />
          <polyline points={linePoints} fill="none" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => (
            <g key={point.date}>
              <circle cx={point.x} cy={point.y} r="8" fill="#22D3EE" opacity="0.12" />
              <circle cx={point.x} cy={point.y} r="4" fill="#0B1220" stroke="#67E8F9" strokeWidth="2.5" />
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {data.map((item) => (
          <div key={item.date} className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-slate-500 sm:text-xs">
              {new Intl.DateTimeFormat(language === 'th' ? 'th-TH' : 'en-US', { weekday: 'short' }).format(new Date(`${item.date}T12:00:00`))}
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-cyan-300 sm:text-sm">{item.events}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
