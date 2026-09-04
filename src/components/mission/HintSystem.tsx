import React, { useState } from 'react';
import { Lightbulb, AlertTriangle, Lock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Hint } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface HintSystemProps {
  hints: Hint[];
  maxReward: number;
  onUnlockHint: (hintId: number) => Promise<void>;
}

export const HintSystem: React.FC<HintSystemProps> = ({
  hints,
  maxReward,
  onUnlockHint
}) => {
  const { language, t } = useLanguage();
  const [confirmingHint, setConfirmingHint] = useState<Hint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const totalPenalty = hints
    .filter(h => h.is_unlocked === 1)
    .reduce((sum, h) => sum + h.xp_penalty, 0);

  const currentAvailableXp = Math.max(30, maxReward - totalPenalty);

  const handleConfirm = async () => {
    if (!confirmingHint) return;
    try {
      setIsSubmitting(true);
      await onUnlockHint(confirmingHint.id);
      setConfirmingHint(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="mission-hint-system" className="bg-[#111820] border border-[#263241] rounded-lg p-4 space-y-3">
      {/* Header toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#F5C542]/10 text-[#F5C542]">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#F4F6F8]">{t('room.hints_title')}</div>
            <div className="text-[11px] text-[#8D9BA8]">
              {t('room.hints_desc')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono text-xs">
            <span className="text-[#8D9BA8]">{t('room.available_xp')}: </span>
            <span className="font-bold text-[#F5C542]">{currentAvailableXp}</span>
            <span className="text-[#8D9BA8]"> / {maxReward}</span>
            {totalPenalty > 0 && (
              <span className="text-[#FF5252] text-[11px] ml-1.5">(-{totalPenalty} XP)</span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded hover:bg-[#161F29] text-[#8D9BA8] hover:text-[#F4F6F8] transition-colors"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Hints List */}
      {isOpen && (
        <div className="pt-2 space-y-2.5 border-t border-[#263241] animate-in fade-in">
          {hints.map((hint) => {
            const isUnlocked = hint.is_unlocked === 1;

            return (
              <div 
                key={hint.id}
                id={`hint-item-${hint.hint_order}`}
                className={`p-3 rounded-lg border transition-all ${
                  isUnlocked
                    ? 'bg-[#0B0F14] border-[#F5C542]/40 text-[#F4F6F8]'
                    : 'bg-[#161F29]/60 border-[#263241] text-[#8D9BA8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#263241] text-[#F5C542]">
                      {language === 'th' ? 'คำใบ้' : 'HINT'} {hint.hint_order}
                    </span>
                    <span className="text-xs font-medium">
                      {language === 'th'
                        ? (hint.hint_order === 1 ? 'แนวทางการวิเคราะห์' : hint.hint_order === 2 ? 'จุดที่ควรตรวจสอบ' : 'แนวทางแก้ไขเฉพาะจุด')
                        : (hint.hint_order === 1 ? 'Diagnostic Vector Clue' : hint.hint_order === 2 ? 'Target Interface / Subnet Clue' : 'Specific Action Solution Clue')}
                    </span>
                  </div>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-[11px] text-[#2ECC71] font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {language === 'th' ? 'ปลดล็อกแล้ว' : 'UNLOCKED'} (-{hint.xp_penalty} XP)
                    </span>
                  ) : (
                    <button
                      id={`unlock-hint-btn-${hint.hint_order}`}
                      onClick={() => setConfirmingHint(hint)}
                      className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded bg-[#F5C542]/10 hover:bg-[#F5C542]/20 text-[#F5C542] border border-[#F5C542]/40 transition-colors"
                    >
                      <Lock className="w-3 h-3" />
                      <span>{language === 'th' ? 'ปลดล็อก' : 'Unlock'} (-{hint.xp_penalty} XP)</span>
                    </button>
                  )}
                </div>

                {isUnlocked && hint.hint_text && (
                  <div className="mt-2.5 pt-2 border-t border-[#263241]/70 text-xs text-[#F4F6F8] leading-relaxed font-mono bg-[#111820] p-2.5 rounded">
                    "{hint.hint_text}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmingHint && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111820] border border-[#263241] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#F5C542]">
              <AlertTriangle className="w-6 h-6" />
              <div className="font-bold text-sm text-[#F4F6F8]">
                {language === 'th' ? `ยืนยันการเปิดคำใบ้ที่ ${confirmingHint.hint_order}` : `Confirm Hint ${confirmingHint.hint_order} Reveal`}
              </div>
            </div>

            <p className="text-xs text-[#8D9BA8] leading-relaxed">
              {language === 'th' ? <>การเปิดคำใบ้นี้จะหัก <span className="text-[#FF5252] font-bold font-mono">-{confirmingHint.xp_penalty} XP</span> จากรางวัลเมื่อจบภารกิจ คุณยืนยันที่จะดำเนินการต่อหรือไม่?</> : <>Revealing this clue will deduct <span className="text-[#FF5252] font-bold font-mono">-{confirmingHint.xp_penalty} XP</span> from your final mission completion reward. Are you sure you want to proceed?</>}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmingHint(null)}
                className="px-3 py-1.5 rounded text-xs font-medium text-[#8D9BA8] hover:text-[#F4F6F8] hover:bg-[#161F29] border border-[#263241]"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                id="confirm-unlock-hint-btn"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded text-xs font-semibold bg-[#F5C542] text-[#0B0F14] hover:bg-[#F5C542]/90 transition-colors"
              >
                {isSubmitting ? (language === 'th' ? 'กำลังปลดล็อก...' : 'Unlocking...') : (language === 'th' ? `ยืนยันและหัก -${confirmingHint.xp_penalty} XP` : `Confirm & Deduct -${confirmingHint.xp_penalty} XP`)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
