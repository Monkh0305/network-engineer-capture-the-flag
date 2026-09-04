import React from 'react';
import { Award, CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react';
import { Achievement } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface AchievementBadgeProps {
  achievement: Achievement;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement }) => {
  const { language } = useLanguage();
  const unlocked = achievement.is_unlocked === 1;

  return (
    <article
      className={`achievement-badge-card group ${unlocked ? 'achievement-unlocked' : 'achievement-locked'}`}
      title={unlocked
        ? (language === 'th' ? `ปลดล็อกแล้ว: ${achievement.description}` : `Unlocked: ${achievement.description}`)
        : (language === 'th' ? `เงื่อนไข: ${achievement.description}` : `Requirement: ${achievement.description}`)}
    >
      <div className="badge-aura" />
      <div className="badge-medallion" aria-hidden="true">
        <div className="badge-shine" />
        {unlocked ? <Award className="h-9 w-9" /> : <LockKeyhole className="h-8 w-8" />}
        {unlocked && <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-white" />}
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-extrabold text-[var(--ctf-text)]">{achievement.name}</h3>
          {unlocked && <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--ctf-success)]" />}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ctf-muted)]">{achievement.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--ctf-border)] pt-3">
          <span className="font-mono text-xs font-bold text-[var(--ctf-cyan)]">{achievement.category}</span>
          <span className={`status-pill ${unlocked ? 'status-complete' : 'status-locked'}`}>
            {unlocked ? (language === 'th' ? 'ปลดล็อกแล้ว' : 'Unlocked') : (language === 'th' ? 'ยังไม่ปลดล็อก' : 'Locked')}
          </span>
        </div>
      </div>
    </article>
  );
};
