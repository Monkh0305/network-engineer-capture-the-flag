import React, { useState } from 'react';
import { Question } from '../../types';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CtfQuestionCardProps {
  question: Question;
  index: number;
  totalQuestions: number;
  onSubmitAnswer: (questionId: number, selectedOption: string) => Promise<{
    isCorrect: boolean;
    rootCause: string | null;
    explanation: string;
  }>;
}

export const CtfQuestionCard: React.FC<CtfQuestionCardProps> = ({
  question,
  index,
  totalQuestions,
  onSubmitAnswer
}) => {
  const { language, t } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<string>(question.selected_answer || '');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    rootCause: string | null;
    explanation: string;
  } | null>(
    question.is_correct !== undefined && question.is_correct !== null
      ? {
          isCorrect: question.is_correct === 1,
          rootCause: question.root_cause || null,
          explanation: question.explanation || ''
        }
      : null
  );

  const isAlreadyCorrect = feedback?.isCorrect === true || question.is_correct === 1;

  const handleSubmit = async () => {
    if (!selectedOption || submitting || isAlreadyCorrect) return;

    try {
      setSubmitting(true);
      const res = await onSubmitAnswer(question.id, selectedOption);
      setFeedback(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ];

  return (
    <div 
      id={`question-card-${question.id}`}
      className="bg-[#111820] border border-[#263241] rounded-xl p-4 sm:p-5 space-y-4 shadow-lg"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#263241] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161F29] border border-[#263241] text-[#F5C542] font-bold">
            {language === 'th' ? `คำถามข้อ ${index + 1} จาก ${totalQuestions}` : `QUESTION ${index + 1} OF ${totalQuestions}`}
          </span>
          <span className="text-xs text-[#8D9BA8]">{language === 'th' ? 'การตรวจสอบคำตอบ CTF' : 'CTF Verification'}</span>
        </div>

        {isAlreadyCorrect && (
          <span className="flex items-center gap-1 text-xs font-mono text-[#2ECC71] font-bold bg-[#2ECC71]/10 px-2 py-0.5 rounded border border-[#2ECC71]/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> {language === 'th' ? 'ตอบถูกแล้ว' : 'SOLVED'}
          </span>
        )}
      </div>

      {/* Question Text */}
      <div className="text-sm font-semibold text-[#F4F6F8] leading-relaxed">
        {question.question}
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;
          const isOptCorrect = isAlreadyCorrect && question.correct_answer === opt.key;

          return (
            <label
              key={opt.key}
              onClick={() => {
                if (!isAlreadyCorrect) {
                  setSelectedOption(opt.key);
                }
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#161F29] border-[#F5C542] shadow-[0_0_10px_rgba(245,197,66,0.15)] text-[#F4F6F8]'
                  : 'bg-[#0B0F14] border-[#263241] hover:border-[#8D9BA8]/60 text-[#8D9BA8]'
              } ${isAlreadyCorrect ? 'cursor-default' : ''}`}
            >
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                  isSelected 
                    ? 'bg-[#F5C542] text-[#0B0F14]' 
                    : 'bg-[#161F29] text-[#8D9BA8] border border-[#263241]'
                }`}
              >
                {opt.key}
              </div>
              <span className="text-xs leading-normal font-medium flex-1">
                {opt.text}
              </span>
            </label>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div 
          id={`feedback-box-${question.id}`}
          className={`p-4 rounded-lg border animate-in fade-in space-y-2 ${
            feedback.isCorrect
              ? 'bg-[#2ECC71]/10 border-[#2ECC71]/40 text-[#F4F6F8]'
              : 'bg-[#FF5252]/10 border-[#FF5252]/40 text-[#F4F6F8]'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs">
            {feedback.isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                <span className="text-[#2ECC71]">{t('room.correct')}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-[#FF5252]" />
                <span className="text-[#FF5252]">{t('room.incorrect')}</span>
              </>
            )}
          </div>

          {feedback.isCorrect && feedback.rootCause && (
            <div className="p-2.5 rounded bg-[#0B0F14]/70 border border-[#2ECC71]/30 text-xs">
              <div className="font-bold text-[#F5C542] uppercase text-[10px] font-mono tracking-wider">
                {t('room.root_cause')}
              </div>
              <div className="font-semibold text-[#F4F6F8] mt-0.5">
                {feedback.rootCause}
              </div>
              <div className="text-[#8D9BA8] text-[11px] mt-1 leading-relaxed">
                {feedback.explanation}
              </div>
            </div>
          )}

          {!feedback.isCorrect && (
            <div className="text-[11px] text-[#8D9BA8]">
              {language === 'th' ? 'ตรวจสอบแผนผังเครือข่ายและผลลัพธ์จาก CLI อีกครั้ง หรือเปิดคำใบ้ในขั้นตอนที่ 4 เพื่อค้นหาจุดที่แพ็กเก็ตถูกทิ้ง' : 'Re-examine the network topology and diagnostic CLI output, or unlock a hint in Task 4 to trace where the packet flow is dropped.'}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      {!isAlreadyCorrect && (
        <div className="flex justify-end pt-2">
          <button
            id={`submit-answer-btn-${question.id}`}
            onClick={handleSubmit}
            disabled={!selectedOption || submitting}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:w-auto ${
              !selectedOption || submitting
                ? 'bg-[#263241] text-[#8D9BA8] cursor-not-allowed'
                : 'bg-[#F5C542] text-[#0B0F14] hover:bg-[#F5C542]/90 shadow-[0_0_15px_rgba(245,197,66,0.3)]'
            }`}
          >
            <span>{submitting ? (language === 'th' ? 'กำลังตรวจสอบ...' : 'Verifying...') : t('room.submit_answer')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
