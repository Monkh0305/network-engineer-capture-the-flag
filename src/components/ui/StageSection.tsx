import React from 'react';
import { LucideIcon, Radio } from 'lucide-react';
import { Mission } from '../../types';
import { ProgressRing } from './ProgressRing';
import { MissionCard } from './MissionCard';
import { useLanguage } from '../../context/LanguageContext';

interface StageSectionProps {
  stage: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  missions: Mission[];
  isLast: boolean;
  onSelectMission: (missionId: number) => void;
}

export const StageSection: React.FC<StageSectionProps> = ({
  stage, title, subtitle, icon: StageIcon, accent, missions, isLast, onSelectMission,
}) => {
  const { language } = useLanguage();
  const completed = missions.filter((mission) => mission.status === 'completed').length;
  const isComplete = missions.length > 0 && completed === missions.length;

  return (
    <section className="stage-section" style={{ '--stage-accent': accent } as React.CSSProperties}>
      {!isLast && <div className="path-flow-line" aria-hidden="true" />}
      <div className="stage-node" aria-hidden="true"><Radio className="h-5 w-5" /></div>

      <div className="stage-panel">
        <div className="stage-heading">
          <div className="flex min-w-0 items-center gap-4">
            <div className="stage-icon"><StageIcon className="h-6 w-6" /></div>
            <div className="min-w-0">
              <div className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--stage-accent)]">
                {language === 'th' ? `ด่านที่ ${stage}` : `Stage ${stage}`}
              </div>
              <h2 className="text-lg font-extrabold text-[var(--ctf-text)]">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ctf-muted)]">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isComplete && <span className="stage-cleared">{language === 'th' ? 'ผ่านด่านแล้ว' : 'Stage cleared'}</span>}
            <ProgressRing value={completed} max={missions.length || 3} label={language === 'th' ? 'สำเร็จ' : 'done'} accent={accent} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {missions.map((mission) => <MissionCard key={mission.id} mission={mission} accent={accent} onSelect={onSelectMission} />)}
        </div>
      </div>
    </section>
  );
};
