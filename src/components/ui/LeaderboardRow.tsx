import React from 'react';
import { Crown } from 'lucide-react';
import { LeaderboardUser } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface LeaderboardRowProps {
  user: LeaderboardUser;
  isCurrent: boolean;
  labels: { you: string; level: string };
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ user, isCurrent, labels }) => {
  const { language } = useLanguage();
  const rankClass = user.rank === 1 ? 'rank-gold' : user.rank === 2 ? 'rank-silver' : user.rank === 3 ? 'rank-bronze' : '';

  return (
    <tr className={`leaderboard-row ${isCurrent ? 'leaderboard-current' : ''}`}>
      <td className="px-5 py-4"><span className={`rank-chip ${rankClass}`}>{user.rank === 1 && <Crown className="h-3.5 w-3.5" />}#{user.rank}</span></td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="leaderboard-avatar">{user.username.slice(0, 1).toUpperCase()}</div>
          <div className="font-semibold text-[var(--ctf-text)]">
            {user.username}
            {isCurrent && <span className="you-chip">{labels.you}</span>}
          </div>
        </div>
      </td>
      <td className="px-5 py-4 font-mono text-[var(--ctf-muted)]">{language === 'th' ? 'ระดับ' : labels.level} {user.level}</td>
      <td className="px-5 py-4 text-right font-mono font-bold text-[var(--ctf-warning)]">{user.flags}</td>
      <td className="px-5 py-4 text-right font-mono font-bold text-[var(--ctf-success)]">{user.completedMissions}</td>
      <td className="px-5 py-4 text-right font-mono font-black text-[var(--ctf-cyan)]">{user.xp.toLocaleString()}</td>
    </tr>
  );
};
