import React from 'react';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  accent?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 68,
  strokeWidth = 7,
  label,
  accent = 'var(--ctf-cyan)',
}) => {
  const safeMax = Math.max(max, 1);
  const percentage = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }} aria-label={`${Math.round(percentage)}%`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--ctf-track)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 5px ${accent})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-sm font-black text-[var(--ctf-text)]">{value}/{max}</span>
        {label && <span className="text-[9px] font-semibold text-[var(--ctf-muted)]">{label}</span>}
      </div>
    </div>
  );
};
