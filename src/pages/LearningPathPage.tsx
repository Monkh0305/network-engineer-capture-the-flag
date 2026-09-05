import React, { useEffect, useState } from 'react';
import { AlertTriangle, Binary, LockKeyhole, Network, Route, Terminal, type LucideIcon } from 'lucide-react';
import type { UserLearningPath } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { localizeMission } from '../context/contentLocalization';
import { StageSection } from '../components/ui/StageSection';

interface LearningPathPageProps { onSelectMission: (missionId: number) => void; }
const stageIcons: Record<string, LucideIcon> = { Network, Terminal, Route, AlertTriangle };

export const LearningPathPage: React.FC<LearningPathPageProps> = ({ onSelectMission }) => {
  const { language, t } = useLanguage();
  const [paths, setPaths] = useState<UserLearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.getLearningPaths().then((response) => setPaths(response.paths)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stages = paths.flatMap((path) => path.stages);
  const missions = stages.flatMap((stage) => stage.missions);
  const completedMissions = missions.filter((mission) => mission.status === 'completed').length;

  return <div className="dashboard-page-theme tech-page mx-auto max-w-[1500px] space-y-8 animate-in fade-in duration-300">
    <header className="page-hero tech-grid-bg"><div className="page-hero-orb page-hero-orb-cyan" /><div className="page-hero-orb page-hero-orb-violet" /><div className="relative z-10 mx-auto max-w-4xl text-center"><span className="eyebrow-chip"><Binary className="h-4 w-4" />{language === 'th' ? 'แผนการเรียนรู้ตามลำดับ' : 'Curriculum roadmap'}</span><h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--ctf-text)] md:text-4xl">{t('path.title')}</h1><p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-[var(--ctf-muted)]">{t('path.subtitle')}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><span className="summary-chip"><strong>{stages.length}</strong>{language === 'th' ? 'ด่านการเรียนรู้' : 'learning stages'}</span><span className="summary-chip"><strong>{missions.length}</strong>{language === 'th' ? 'ภารกิจทั้งหมด' : 'total missions'}</span><span className="summary-chip summary-chip-success"><strong>{completedMissions}</strong>{language === 'th' ? 'ภารกิจที่สำเร็จ' : 'completed'}</span></div></div></header>

    {loading ? <div className="space-y-6" aria-label={language === 'th' ? 'กำลังโหลดเส้นทางการเรียนรู้' : 'Loading learning path'}>{[1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-[var(--ctf-radius-xl)] bg-[var(--ctf-surface)] ring-1 ring-[var(--ctf-border)]" />)}</div>
      : paths.length === 0 ? <div className="rounded-3xl border border-dashed border-[var(--ctf-border)] bg-[var(--ctf-surface)] p-12 text-center text-[var(--ctf-muted)]"><LockKeyhole className="mx-auto mb-3 h-8 w-8" />{language === 'th' ? 'ยังไม่มีเส้นทางการเรียนรู้ที่เผยแพร่' : 'No published learning paths yet'}</div>
      : paths.map((path) => <section key={path.id} className="space-y-6"><div className="rounded-2xl border border-[var(--ctf-border)] bg-[var(--ctf-surface)] p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-cyan-400">Learning Path</p><h2 className="mt-1 text-xl font-black text-[var(--ctf-text)]">{path.name}</h2><p className="mt-1 text-sm text-[var(--ctf-muted)]">{path.description}</p></div><div className="path-roadmap">{path.stages.map((stage, index) => <StageSection key={stage.id} stage={stage.orderIndex} title={stage.name} subtitle={`${stage.description}${!stage.prerequisiteMet ? language === 'th' ? ' · ต้องผ่านด่านก่อนหน้าให้ครบ' : ' · Complete the prerequisite stage first' : ''}`} icon={stageIcons[stage.icon] || Network} accent={stage.accent} missions={stage.missions.map((mission) => localizeMission(mission, language))} isLast={index === path.stages.length - 1} onSelectMission={onSelectMission} />)}</div></section>)}
  </div>;
};
