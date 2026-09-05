import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AdminKpiCardProps {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: 'cyan' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';
}

const toneClasses = {
  cyan: 'border-cyan-300/20 from-cyan-400/16 text-cyan-300 shadow-cyan-500/5',
  blue: 'border-blue-300/20 from-blue-500/16 text-blue-300 shadow-blue-500/5',
  violet: 'border-violet-300/20 from-violet-500/16 text-violet-300 shadow-violet-500/5',
  emerald: 'border-emerald-300/20 from-emerald-400/16 text-emerald-300 shadow-emerald-500/5',
  amber: 'border-amber-300/20 from-amber-400/16 text-amber-300 shadow-amber-500/5',
  rose: 'border-rose-300/20 from-rose-400/16 text-rose-300 shadow-rose-500/5',
} as const;

export const AdminKpiCard: React.FC<AdminKpiCardProps> = ({ label, value, note, icon: Icon, tone }) => (
  <article className={`group relative min-h-44 overflow-hidden rounded-2xl border bg-gradient-to-br ${toneClasses[tone]} to-slate-900/80 p-5 shadow-xl transition duration-200 hover:-translate-y-1 hover:border-current/30`}>
    <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-current opacity-[0.06] blur-3xl" />
    <div className="relative flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-400">{label}</p>
        <p className="mt-4 break-words font-mono text-3xl font-black tracking-tight text-white sm:text-[2rem]">{value}</p>
      </div>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-current/20 bg-current/10 shadow-[0_0_24px_currentColor] shadow-current/5">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <p className="relative mt-4 text-xs leading-5 text-slate-500">{note}</p>
  </article>
);
