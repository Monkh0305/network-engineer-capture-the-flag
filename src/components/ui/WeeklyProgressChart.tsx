import React from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const WeeklyProgressChart: React.FC = () => {
  const { language } = useLanguage();
  const days = language === 'th' ? ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [22, 34, 30, 52, 47, 69, 82];
  const points = values.map((value, index) => `${16 + index * 44},${92 - value * 0.72}`).join(' ');
  const areaPoints = `16,100 ${points} 280,100`;

  return (
    <section className="weekly-chart-card">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="chart-icon"><Activity className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-extrabold text-[var(--ctf-text)]">{language === 'th' ? 'ความคืบหน้ารายสัปดาห์' : 'Weekly progress'}</h2>
            <p className="text-sm text-[var(--ctf-muted)]">{language === 'th' ? 'กิจกรรมการเรียนรู้ใน 7 วันที่ผ่านมา' : 'Learning activity over the last 7 days'}</p>
          </div>
        </div>
        <span className="trend-chip"><TrendingUp className="h-4 w-4" />+18%</span>
      </div>
      <div className="mt-5 grid grid-cols-1 items-end gap-5 sm:grid-cols-[1fr_auto]">
        <div>
          <svg viewBox="0 0 296 108" className="h-36 w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label={language === 'th' ? 'กราฟความคืบหน้ารายสัปดาห์' : 'Weekly progress chart'}>
            <defs>
              <linearGradient id="weeklyArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="weeklyLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="55%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            {[28, 52, 76, 100].map((y) => <line key={y} x1="10" x2="286" y1={y} y2={y} stroke="var(--ctf-border)" strokeDasharray="3 5" />)}
            <polygon points={areaPoints} fill="url(#weeklyArea)" />
            <polyline points={points} fill="none" stroke="url(#weeklyLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {values.map((value, index) => <circle key={index} cx={16 + index * 44} cy={92 - value * 0.72} r="4" fill="var(--ctf-surface-strong)" stroke="#22D3EE" strokeWidth="2" />)}
          </svg>
          <div className="grid grid-cols-7 text-center font-mono text-xs text-[var(--ctf-muted)]">{days.map((day) => <span key={day}>{day}</span>)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
          <div className="chart-stat"><strong>7</strong><span>{language === 'th' ? 'วันต่อเนื่อง' : 'day streak'}</span></div>
          <div className="chart-stat"><strong>3</strong><span>{language === 'th' ? 'ภารกิจสำเร็จ' : 'completed'}</span></div>
        </div>
      </div>
    </section>
  );
};
