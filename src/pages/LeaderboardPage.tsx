import React, { useEffect, useState } from 'react';
import { Crown, RadioTower, Trophy, Zap } from 'lucide-react';
import { LeaderboardUser, User } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { LeaderboardRow } from '../components/ui/LeaderboardRow';

interface LeaderboardPageProps {
  currentUser: User;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ currentUser }) => {
  const { language, t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [filterCohort, setFilterCohort] = useState<'all' | 'cohort'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await api.getLeaderboard();
        setLeaderboard(response.leaderboard);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const podium = topThree.length >= 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;

  return (
    <div className="dashboard-page-theme tech-page mx-auto max-w-[1500px] space-y-7 animate-in fade-in duration-300">
      <header className="page-hero tech-grid-bg">
        <div className="page-hero-orb page-hero-orb-cyan" />
        <div className="relative z-10 text-center">
          <span className="eyebrow-chip"><RadioTower className="h-4 w-4" />{language === 'th' ? 'อันดับคะแนนทั่วโลก' : 'Global cadet rankings'}</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--ctf-text)]">{t('lb.title')}</h1>
          <p className="mx-auto mt-2 max-w-3xl text-base leading-relaxed text-[var(--ctf-muted)]">{t('lb.subtitle')}</p>
        </div>
      </header>

      {!loading && podium.length >= 3 && (
        <section className="grid grid-cols-1 items-end gap-5 pt-4 md:grid-cols-3">
          {podium.map((user) => {
            const isWinner = user.rank === 1;
            const podiumClass = user.rank === 1 ? 'podium-gold' : user.rank === 2 ? 'podium-silver' : 'podium-bronze';
            return (
              <article key={user.id} className={`podium-card ${podiumClass} ${isWinner ? 'md:-translate-y-5' : ''}`}>
                {isWinner && <div className="podium-crown"><Crown className="h-6 w-6 fill-current" /></div>}
                <div className="podium-rank">#{user.rank}</div>
                <div className="mt-4 text-lg font-extrabold text-[var(--ctf-text)]">{user.username}</div>
                <div className="mt-1 font-mono text-sm font-semibold text-[var(--ctf-muted)]">
                  {language === 'th' ? `ระดับ ${user.level}` : `Level ${user.level}`}
                </div>
                <div className="podium-xp"><Zap className="h-5 w-5 fill-current" />{user.xp.toLocaleString()} XP</div>
                <div className="mt-3 text-sm text-[var(--ctf-muted)]">{user.flags} {language === 'th' ? 'ธง' : 'flags'} · {user.completedMissions} {language === 'th' ? 'ภารกิจ' : 'missions'}</div>
              </article>
            );
          })}
        </section>
      )}

      <section className="leaderboard-table-shell">
        <div className="flex flex-col items-stretch justify-between gap-4 border-b border-[var(--ctf-border)] p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-[var(--ctf-cyan)] ring-1 ring-cyan-400/20"><Trophy className="h-5 w-5" /></div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--ctf-text)]">{language === 'th' ? 'ตารางอันดับคะแนนรวม' : 'Roster standings'}</h2>
              <p className="text-sm text-[var(--ctf-muted)]">{language === 'th' ? 'จัดอันดับจากคะแนน XP และภารกิจที่สำเร็จ' : 'Ranked by XP and completed missions'}</p>
            </div>
          </div>
          <div className="filter-segment">
            <button type="button" onClick={() => setFilterCohort('all')} className={filterCohort === 'all' ? 'is-active' : ''}>{language === 'th' ? 'ตลอดกาล' : 'All time'}</button>
            <button type="button" onClick={() => setFilterCohort('cohort')} className={filterCohort === 'cohort' ? 'is-active' : ''}>{language === 'th' ? 'รุ่นโครงงาน CS-480' : 'CS-480 cohort'}</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--ctf-border)] text-xs uppercase tracking-[0.12em] text-[var(--ctf-muted)]">
                <th className="w-20 px-5 py-4">{t('lb.rank')}</th>
                <th className="px-5 py-4">{t('lb.cadet')}</th>
                <th className="px-5 py-4">{t('lb.level')}</th>
                <th className="px-5 py-4 text-right">{t('lb.flags')}</th>
                <th className="px-5 py-4 text-right">{t('lb.missions')}</th>
                <th className="px-5 py-4 text-right">{t('lb.xp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ctf-border)]">
              {leaderboard.map((user) => (
                <LeaderboardRow
                  key={user.id}
                  user={user}
                  isCurrent={user.username === currentUser.username}
                  labels={{ you: t('lb.you'), level: t('lb.level') }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
