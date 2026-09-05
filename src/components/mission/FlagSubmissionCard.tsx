import React, { useState } from 'react';
import { Mission } from '../../types';
import { Flag, Trophy, Coins, Zap, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FlagSubmissionCardProps {
  mission: Mission;
  isAllQuestionsSolved: boolean;
  onCompleteMission: (flag: string) => Promise<any>;
  onNextMission: () => void;
}

export const FlagSubmissionCard: React.FC<FlagSubmissionCardProps> = ({
  mission,
  isAllQuestionsSolved,
  onCompleteMission,
  onNextMission
}) => {
  const { language, t } = useLanguage();
  const [flagInput, setFlagInput] = useState(mission.status === 'completed' ? (mission.target_flag || '') : '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completionResult, setCompletionResult] = useState<any>(
    mission.status === 'completed' ? {
      success: true,
      flag: mission.target_flag || '',
      xpEarned: mission.xp_earned || mission.xp_reward,
      coinsEarned: 500
    } : null
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!flagInput.trim() || submitting) return;

    setErrorMsg(null);
    try {
      setSubmitting(true);
      const res = await onCompleteMission(flagInput.trim());
      setCompletionResult(res);
    } catch (err: any) {
      setErrorMsg(language === 'th' ? 'รหัสธงไม่ถูกต้อง กรุณาตรวจสอบผลการวิเคราะห์อีกครั้ง' : (err.message || 'Incorrect flag. Verify your investigation.'));
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = !!completionResult?.success || mission.status === 'completed';

  return (
    <div 
      id="flag-capture-card" 
      className={`rounded-xl border p-4 sm:p-6 space-y-6 transition-all shadow-xl ${
        isCompleted 
          ? 'bg-gradient-to-b from-[#111820] to-[#161F29] border-[#2ECC71]/50 shadow-[0_0_25px_rgba(46,204,113,0.15)]' 
          : 'bg-[#111820] border-[#263241]'
      }`}
    >
      {/* Title / Banner */}
      <div className="flex flex-col items-start gap-3 border-b border-[#263241] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isCompleted 
              ? 'bg-[#2ECC71]/10 border-[#2ECC71]/40 text-[#2ECC71]' 
              : 'bg-[#F5C542]/10 border-[#F5C542]/40 text-[#F5C542]'
          }`}>
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#8D9BA8]">
              {language === 'th' ? 'เป้าหมายสุดท้าย' : 'Final Objective'}
            </div>
            <h3 className="text-base font-bold text-[#F4F6F8]">
              {isCompleted ? t('room.mission_complete') : (language === 'th' ? 'ชิงธง' : 'Capture The Flag')}
            </h3>
          </div>
        </div>

        {isCompleted && (
          <span className="flex items-center gap-1 text-xs font-bold text-[#2ECC71] bg-[#2ECC71]/10 px-3 py-1 rounded-full border border-[#2ECC71]/40">
            <CheckCircle2 className="w-4 h-4" /> {language === 'th' ? 'พิชิตธงแล้ว' : 'FLAG CAPTURED'}
          </span>
        )}
      </div>

      {/* When Completed */}
      {isCompleted ? (
        <div className="space-y-6 text-center py-2 animate-in zoom-in-95">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2ECC71]/20 border-2 border-[#2ECC71] text-[#2ECC71] shadow-[0_0_20px_rgba(46,204,113,0.4)]">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <div className="text-xl font-extrabold tracking-wide text-[#F4F6F8]">
              {t('room.mission_complete')}
            </div>
            <div className="text-xs text-[#8D9BA8] mt-1">
              {language === 'th' ? `คุณตรวจสอบและแก้ไขเหตุขัดข้องของ${mission.department}สำเร็จแล้ว` : `You have successfully investigated and resolved the incident in ${mission.department}.`}
            </div>
          </div>

          {/* Revealed Flag Box */}
          <div className="max-w-md mx-auto p-3.5 bg-[#0B0F14] rounded-lg border border-[#F5C542]/40 shadow-inner">
            <div className="text-[10px] uppercase font-mono text-[#8D9BA8] mb-1">{language === 'th' ? 'รหัสธงที่ยืนยันแล้ว' : 'Authenticated Flag Token'}</div>
            <div className="font-mono text-sm font-bold text-[#F5C542] tracking-wider selection:bg-[#F5C542]/20">
              {completionResult?.flag || mission.target_flag || 'FLAG{VERIFIED}'}
            </div>
          </div>

          {/* Reward Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#161F29] border border-[#263241]">
              <Zap className="w-4 h-4 text-[#00C2FF]" />
              <div className="text-left">
                <div className="text-[10px] text-[#8D9BA8] font-mono">{language === 'th' ? 'รางวัล' : 'REWARD'}</div>
                <div className="text-xs font-bold text-[#00C2FF]">+{completionResult?.xpEarned || mission.xp_reward} XP</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#161F29] border border-[#263241]">
              <Coins className="w-4 h-4 text-[#F5C542]" />
              <div className="text-left">
                <div className="text-[10px] text-[#8D9BA8] font-mono">{language === 'th' ? 'โบนัส' : 'BONUS'}</div>
                <div className="text-xs font-bold text-[#F5C542]">+{completionResult?.coinsEarned || 500} {language === 'th' ? 'เหรียญ' : 'Coins'}</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="next-mission-btn"
              onClick={onNextMission}
              className="px-6 py-2.5 rounded-lg bg-[#F5C542] text-[#0B0F14] font-bold text-xs hover:bg-[#F5C542]/90 transition-all shadow-[0_0_20px_rgba(245,197,66,0.3)] inline-flex items-center gap-2"
            >
              <span>{t('room.next_mission')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Flag Input Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-xs text-[#8D9BA8] leading-relaxed">
            {language === 'th' ? <>ส่งรหัสธงที่ได้รับหลังจากตรวจสอบปัญหาและตอบคำถามยืนยันครบแล้ว รูปแบบมาตรฐานคือ <span className="font-mono text-[#F5C542]">FLAG{'{...}'}</span></> : <>Submit the flag acquired after completing the investigation and answering the verification questions. The flag is in the standard format: <span className="font-mono text-[#F5C542]">FLAG{'{...}'}</span>.</>}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <input
                id="flag-submission-input"
                type="text"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="FLAG{ENTER_DISCOVERED_FLAG_HERE}"
                className="w-full bg-[#0B0F14] border border-[#263241] rounded-lg px-4 py-2.5 text-xs text-[#F4F6F8] font-mono placeholder-[#8D9BA8]/40 focus:outline-none focus:border-[#F5C542] focus:ring-1 focus:ring-[#F5C542]"
              />
            </div>

            <div className="pt-1 text-[11px] text-[#8D9BA8]">
              {language === 'th'
                ? 'นำรหัสธงที่ค้นพบจากแล็บ Packet Tracer มากรอกในช่องด้านบน'
                : 'Enter the flag discovered while completing the Packet Tracer lab.'}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-[#FF5252]/10 border border-[#FF5252]/40 text-xs text-[#FF5252]">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-mono text-[#8D9BA8]">
              {language === 'th' ? 'รางวัลโดยประมาณ:' : 'Estimated Reward:'} <span className="text-[#00C2FF] font-bold">+{mission.xp_reward} XP</span>, <span className="text-[#F5C542] font-bold">+500 {language === 'th' ? 'เหรียญ' : 'Coins'}</span>
            </div>

            <button
              id="submit-flag-btn"
              type="submit"
              disabled={!flagInput.trim() || submitting}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold transition-all sm:w-auto ${
                !flagInput.trim() || submitting
                  ? 'bg-[#263241] text-[#8D9BA8] cursor-not-allowed'
                  : 'bg-[#F5C542] text-[#0B0F14] hover:bg-[#F5C542]/90 shadow-[0_0_15px_rgba(245,197,66,0.3)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{submitting ? (language === 'th' ? 'กำลังยืนยัน...' : 'Authenticating...') : t('room.submit_flag')}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
