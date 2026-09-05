import React, { useEffect, useState } from 'react';
import { GraduationCap, CheckCircle2, Award, ArrowRight, HelpCircle, RotateCcw, TrendingUp } from 'lucide-react';
import { AssessmentQuestion, AssessmentResult } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { localizeAssessmentQuestion } from '../context/contentLocalization';

export const AssessmentPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [activeTest, setActiveTest] = useState<'pretest' | 'posttest'>('posttest');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadAssessment();
  }, [activeTest]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const [qRes, rRes] = await Promise.all([
        api.getAssessmentQuestions(activeTest),
        api.getAssessmentResults()
      ]);
      setQuestions(qRes.questions);
      setAssessmentResults(rRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qId: number, opt: string) => {
    setAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(answers).length < questions.length) {
      alert(language === 'th' ? `กรุณาตอบคำถามให้ครบทั้ง ${questions.length} ข้อก่อนส่ง` : `Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    try {
      setSubmitting(true);
      let res;
      if (activeTest === 'pretest') {
        res = await api.submitPretest(answers);
      } else {
        res = await api.submitPosttest(answers);
      }
      setSubmittedResult(res);
      // Reload results
      const updated = await api.getAssessmentResults();
      setAssessmentResults(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="dashboard-page-theme mx-auto max-w-5xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="dashboard-content-card relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-7">
        <div className="pointer-events-none absolute left-1/2 top-0 h-28 w-64 -translate-x-1/2 rounded-full bg-cyan-100/80 blur-3xl" />
        <div className="relative space-y-2">
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/40 text-[#00C2FF] uppercase tracking-wider">
          {language === 'th' ? 'ส่วนการวิจัยโครงงานปริญญานิพนธ์' : 'University Capstone Research Module'}
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-[#F4F6F8] tracking-tight">
          {t('assess.title')}
        </h1>
        <p className="text-xs text-[#8D9BA8] max-w-xl mx-auto">
          {t('assess.subtitle')}
        </p>
        </div>
      </div>

      {/* Test Selection Tabs & Performance Summary */}
      <div className="dashboard-content-card bg-[#111820] border border-[#263241] rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
        <div className="flex flex-col items-stretch justify-between gap-4 border-b border-[#263241] pb-4 sm:flex-row sm:items-center">
          <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:w-auto">
            <button
              onClick={() => {
                setActiveTest('pretest');
                setSubmittedResult(null);
                setAnswers({});
              }}
              className={`w-full px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTest === 'pretest'
                  ? 'bg-[#00C2FF] text-[#0B0F14] shadow-[0_0_15px_rgba(0,194,255,0.3)]'
                  : 'bg-[#161F29] text-[#8D9BA8] hover:text-[#F4F6F8] border border-[#263241]'
              }`}
            >
              {t('assess.pretest_tab')}
            </button>

            <button
              onClick={() => {
                setActiveTest('posttest');
                setSubmittedResult(null);
                setAnswers({});
              }}
              className={`w-full px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTest === 'posttest'
                  ? 'bg-[#F5C542] text-[#0B0F14] shadow-[0_0_15px_rgba(245,197,66,0.3)]'
                  : 'bg-[#161F29] text-[#8D9BA8] hover:text-[#F4F6F8] border border-[#263241]'
              }`}
            >
              {t('assess.posttest_tab')}
            </button>
          </div>

          <div className="text-xs font-mono text-[#8D9BA8]">
            {language === 'th' ? 'ความคืบหน้า:' : 'Progress:'} <span className="text-[#F5C542] font-bold">{answeredCount}</span> / {questions.length} {language === 'th' ? 'ข้อ' : 'Questions Answered'}
          </div>
        </div>

        {/* Existing Results Ribbon */}
        {assessmentResults && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#263241] text-center">
              <span className="text-[10px] text-[#8D9BA8] font-mono uppercase">{language === 'th' ? 'คะแนนก่อนเรียน' : 'Pre-Test Score'}</span>
              <div className="text-xl font-black text-[#F4F6F8] font-mono">
                {assessmentResults.pretest ? `${assessmentResults.pretest.score}%` : (language === 'th' ? 'ยังไม่มีผล' : 'Not recorded')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#263241] text-center">
              <span className="text-[10px] text-[#8D9BA8] font-mono uppercase">{language === 'th' ? 'คะแนนหลังเรียน' : 'Post-Test Score'}</span>
              <div className="text-xl font-black text-[#00C2FF] font-mono">
                {assessmentResults.posttest ? `${assessmentResults.posttest.score}%` : (language === 'th' ? 'ยังไม่เสร็จ' : 'Not completed')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#2ECC71]/40 text-center">
              <span className="text-[10px] text-[#2ECC71] font-mono uppercase">{t('assess.growth')}</span>
              <div className="text-xl font-black text-[#2ECC71] font-mono">
                {assessmentResults.improvement !== null ? `${assessmentResults.improvement > 0 ? '+' : ''}${assessmentResults.improvement} ${language === 'th' ? 'จุดเปอร์เซ็นต์' : 'pp'}` : '—'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submitted Result Notification */}
      {submittedResult && (
        <div className="p-6 rounded-2xl bg-[#2ECC71]/10 border border-[#2ECC71]/40 text-center space-y-2 animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-[#2ECC71]/20 border border-[#2ECC71] flex items-center justify-center text-[#2ECC71] mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#F4F6F8]">
            {language === 'th' ? t('assess.success_msg') : `${submittedResult.assessmentType.toUpperCase()} SUBMITTED SUCCESSFULLY!`}
          </h3>
          <p className="text-sm font-mono text-[#2ECC71]">
            {language === 'th' ? `คะแนน: ${submittedResult.score}% (ถูก ${submittedResult.correctCount} จาก ${submittedResult.totalQuestions} ข้อ)` : `Score: ${submittedResult.score}% (${submittedResult.correctCount} of ${submittedResult.totalQuestions} Correct)`}
          </p>
          <p className="text-xs text-[#8D9BA8]">
            {language === 'th' ? 'บันทึกผลการประเมินลงในฐานข้อมูลงานวิจัยเรียบร้อยแล้ว' : 'Your evaluation metrics have been persisted to the academic research database.'}
          </p>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {!loading && questions.length === 0 && <div className="rounded-2xl border border-dashed border-[#263241] bg-[#111820] p-8 text-center text-sm text-[#8D9BA8]">{language === 'th' ? 'ยังไม่มีแบบทดสอบที่เปิดใช้งานในขณะนี้' : 'No active assessment is currently available.'}</div>}
        {questions.map((sourceQuestion, idx) => {
          const q = localizeAssessmentQuestion(sourceQuestion, language);
          const selected = answers[q.id];
          const options = [
            { key: 'A', text: q.option_a },
            { key: 'B', text: q.option_b },
            { key: 'C', text: q.option_c },
            { key: 'D', text: q.option_d },
          ];

          return (
            <div
              key={q.id}
              className="dashboard-content-card bg-[#111820] border border-[#263241] rounded-2xl p-4 sm:p-6 space-y-4 shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#263241] pb-2">
                <span className="text-[10px] font-mono text-[#F5C542] font-bold">
                  {language === 'th' ? `คำถามข้อ ${idx + 1} จาก ${questions.length}` : `QUESTION ${idx + 1} OF ${questions.length}`}
                </span>
                <span className="text-[10px] font-mono text-[#8D9BA8]">{q.category}</span>
              </div>

              <p className="text-sm font-semibold text-[#F4F6F8]">
                {q.question}
              </p>

              <div className="space-y-2">
                {options.map((opt) => (
                  <label
                    key={opt.key}
                    onClick={() => handleOptionSelect(q.id, opt.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selected === opt.key
                        ? 'bg-[#161F29] border-[#00C2FF] text-[#F4F6F8]'
                        : 'bg-[#0B0F14] border-[#263241] text-[#8D9BA8] hover:border-[#8D9BA8]/60'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      selected === opt.key ? 'bg-[#00C2FF] text-[#0B0F14]' : 'bg-[#161F29] text-[#8D9BA8]'
                    }`}>
                      {opt.key}
                    </div>
                    <span className="text-xs font-medium">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting || questions.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5C542] px-8 py-3 text-xs font-bold text-[#0B0F14] shadow-[0_0_20px_rgba(245,197,66,0.3)] transition-all hover:bg-[#F5C542]/90 sm:w-auto"
          >
            <span>{submitting ? (language === 'th' ? 'กำลังคำนวณคะแนน...' : 'Calculating Score...') : (language === 'th' ? 'ส่งแบบทดสอบ' : `Submit ${activeTest === 'pretest' ? 'Pre-Test' : 'Post-Test'}`)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
