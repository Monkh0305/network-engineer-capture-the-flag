import React from 'react';
import { ArrowUpRight, Clock3, LockKeyhole, Zap } from 'lucide-react';
import { Mission } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from './StatusBadge';

interface MissionCardProps {
  mission: Mission;
  accent: string;
  onSelect: (missionId: number) => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({ mission, accent, onSelect }) => {
  const { language } = useLanguage();
  const isLocked = mission.status === 'locked';

  return (
    <article
      id={`path-mission-card-${mission.order_index}`}
      onClick={() => !isLocked && onSelect(mission.id)}
      className={`mission-card-premium group ${isLocked ? 'mission-card-locked cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ '--mission-accent': accent } as React.CSSProperties}
      aria-disabled={isLocked}
    >
      <div className="mission-card-glow" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="mission-index">{String(mission.order_index).padStart(2, '0')}</span>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ctf-muted)]">
            {language === 'th' ? 'ภารกิจ' : 'Mission'}
          </span>
        </div>
        <StatusBadge status={mission.status} compact />
      </div>

      <div className="relative z-10 mt-5 space-y-2">
        <h3 className="text-base font-bold leading-snug text-[var(--ctf-text)] transition-colors group-hover:text-[var(--mission-accent)]">
          {mission.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ctf-muted)]">{mission.description}</p>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between gap-3 border-t border-[var(--ctf-border)] pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="xp-chip"><Zap className="h-4 w-4" />+{mission.xp_reward} XP</span>
          <span className="meta-chip"><Clock3 className="h-4 w-4" />{mission.estimated_time}</span>
        </div>
        <span className="mission-launch-icon">
          {isLocked ? <LockKeyhole className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
        </span>
      </div>

      {isLocked && (
        <div className="locked-sheen" aria-hidden="true">
          <LockKeyhole className="h-10 w-10" />
        </div>
      )}
    </article>
  );
};
