import React, { useEffect, useState } from 'react';
import { User, CategoryProgress, AssessmentResult } from '../types';
import { api } from '../services/api';
import { 
  User as UserIcon, 
  Zap, 
  Flame, 
  Coins, 
  Trophy, 
  GraduationCap, 
  TrendingUp, 
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { localizeCategoryLabel } from '../context/contentLocalization';

interface ProfilePageProps {
  user: User;
  onNavigateTab: (tab: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onNavigateTab }) => {
  const { language, t } = useLanguage();
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult | null>(null);
  const [categories, setCategories] = useState<CategoryProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assessRes, progRes] = await Promise.all([
        api.getAssessmentResults(),
        api.getProgress()
      ]);
      setAssessmentResults(assessRes);
      setCategories(progRes.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page-theme mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Profile Card */}
      <div className="dashboard-accent-card bg-gradient-to-r from-[#161F29] to-[#111820] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00C2FF]/30 to-[#F5C542]/30 border-2 border-[#F5C542] flex items-center justify-center font-mono text-3xl font-black text-[#F5C542] shadow-xl">
          {user.username.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-extrabold text-[#F4F6F8]">{user.username}</h1>
              <p className="text-xs text-[#8D9BA8] font-mono">{user.email}</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-[#F5C542]/10 border border-[#F5C542]/40 text-[#F5C542] text-xs font-mono font-bold self-center md:self-auto">
              {language === 'th' ? `ระดับผู้ฝึกหัด: ${user.level}` : `CADET RANK: LEVEL ${user.level}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#00C2FF]">
              <Zap className="w-4 h-4" />
              <span className="font-bold">{user.xp}</span>
              <span className="text-[#8D9BA8]">XP</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#F5C542]">
              <Coins className="w-4 h-4" />
              <span className="font-bold">{user.coins}</span>
              <span className="text-[#8D9BA8]">{language === 'th' ? 'เหรียญ' : 'Coins'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#FF5252]">
              <Flame className="w-4 h-4" />
              <span className="font-bold">{user.streak}</span>
              <span className="text-[#8D9BA8]">{language === 'th' ? 'วันต่อเนื่อง' : 'Days Streak'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capstone Educational Research Performance */}
      <div className="dashboard-content-card bg-[#111820] border border-[#263241] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col items-start gap-3 border-b border-[#263241] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#00C2FF]" />
            <div>
              <h3 className="text-sm font-bold text-[#F4F6F8]">{t('prof.capstone_title')}</h3>
              <p className="text-[11px] text-[#8D9BA8]">{t('prof.capstone_sub')}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('assessment')}
            className="text-xs text-[#00C2FF] hover:underline font-mono"
          >
            {t('prof.open_assessment')} →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#263241] text-center space-y-1">
            <span className="text-[10px] font-mono text-[#8D9BA8] uppercase">{t('prof.baseline_pre')}</span>
            <div className="text-3xl font-black font-mono text-[#F4F6F8]">
              {assessmentResults?.pretest ? `${assessmentResults.pretest.score}%` : (language === 'th' ? 'ยังไม่ได้ทำ' : 'Not Taken')}
            </div>
            <p className="text-[10px] text-[#8D9BA8]">{language === 'th' ? 'การประเมินทักษะเครือข่ายเบื้องต้น' : 'Initial Networking Diagnostic'}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#263241] text-center space-y-1">
            <span className="text-[10px] font-mono text-[#8D9BA8] uppercase">{t('prof.post_training')}</span>
            <div className="text-3xl font-black font-mono text-[#00C2FF]">
              {assessmentResults?.posttest ? `${assessmentResults.posttest.score}%` : (language === 'th' ? 'รอดำเนินการ' : 'Pending')}
            </div>
            <p className="text-[10px] text-[#8D9BA8]">{language === 'th' ? 'ประเมินหลังทำภารกิจ CTF' : 'Evaluated After CTF Missions'}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#2ECC71]/40 text-center space-y-1">
            <span className="text-[10px] font-mono text-[#8D9BA8] uppercase">{t('prof.measured_growth')}</span>
            <div className="text-3xl font-black font-mono text-[#2ECC71]">
              {assessmentResults?.improvement !== null ? `+${assessmentResults?.improvement}%` : '—'}
            </div>
            <p className="text-[10px] text-[#2ECC71]">{language === 'th' ? 'พัฒนาการด้านทักษะที่วัดได้' : 'Demonstrated Competency Growth'}</p>
          </div>
        </div>
      </div>

      {/* Network Domain Competencies */}
      <div className="dashboard-content-card bg-[#111820] border border-[#263241] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-[#F4F6F8] uppercase tracking-wider font-mono">
          {language === 'th' ? 'ความเชี่ยวชาญด้านวิศวกรรมเครือข่าย' : 'Network Engineering Domain Competency'}
        </h3>

        <div className="space-y-3">
          {categories.map((c) => (
            <div key={c.category} className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#F4F6F8] font-semibold">{localizeCategoryLabel(c.category, language)}</span>
                <span className="text-[#F5C542] font-bold">{language === 'th' ? `สำเร็จ ${c.percentage}%` : `${c.percentage}% Complete`}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0B0F14] border border-[#263241] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00C2FF] to-[#F5C542] transition-all rounded-full"
                  style={{ width: `${c.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
