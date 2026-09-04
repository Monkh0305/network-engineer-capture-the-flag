import React, { useEffect, useState } from 'react';
import { Award, Sparkles, Trophy } from 'lucide-react';
import { Achievement } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { localizeAchievement } from '../context/contentLocalization';
import { AchievementBadge } from '../components/ui/AchievementBadge';

export const AchievementsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoading(true);
        const response = await api.getAchievements();
        setAchievements(response.achievements);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, []);

  const unlockedCount = achievements.filter((achievement) => achievement.is_unlocked === 1).length;

  return (
    <div className="dashboard-page-theme tech-page mx-auto max-w-[1500px] space-y-7 animate-in fade-in duration-300">
      <header className="page-hero tech-grid-bg">
        <div className="page-hero-orb page-hero-orb-violet" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-3xl">
            <span className="eyebrow-chip"><Sparkles className="h-4 w-4" />{language === 'th' ? 'คลังความสำเร็จ' : 'Achievement vault'}</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--ctf-text)]">{t('ach.title')}</h1>
            <p className="mt-2 text-base leading-relaxed text-[var(--ctf-muted)]">{t('ach.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--ctf-border)] bg-[var(--ctf-surface-strong)] p-4 shadow-[var(--ctf-shadow-sm)]">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-[var(--ctf-cyan)] ring-1 ring-cyan-400/25"><Trophy className="h-6 w-6" /></div>
            <div>
              <div className="font-mono text-2xl font-black text-[var(--ctf-text)]">{unlockedCount}<span className="text-[var(--ctf-muted)]">/{achievements.length}</span></div>
              <div className="text-sm font-semibold text-[var(--ctf-muted)]">{language === 'th' ? 'เหรียญที่ปลดล็อกแล้ว' : 'badges unlocked'}</div>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-52 animate-pulse rounded-[var(--ctf-radius-lg)] bg-[var(--ctf-surface)] ring-1 ring-[var(--ctf-border)]" />)}
        </div>
      ) : achievements.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map((sourceAchievement) => (
            <AchievementBadge key={sourceAchievement.id} achievement={localizeAchievement(sourceAchievement, language)} />
          ))}
        </div>
      ) : (
        <div className="dashboard-content-card flex min-h-64 flex-col items-center justify-center gap-3 border p-8 text-center">
          <Award className="h-10 w-10 text-[var(--ctf-muted)]" />
          <p className="text-base font-semibold text-[var(--ctf-muted)]">{language === 'th' ? 'ยังไม่มีเหรียญในคลัง' : 'No badges available yet'}</p>
        </div>
      )}
    </div>
  );
};
