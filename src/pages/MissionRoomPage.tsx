import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Network, 
  Terminal, 
  Search, 
  HelpCircle, 
  Flag, 
  CheckCircle2, 
  Clock, 
  Zap, 
  AlertTriangle, 
  Download, 
  ExternalLink, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { Mission, MissionTask, Question, Hint } from '../types';
import { api } from '../services/api';
import { NetworkTopology } from '../components/mission/NetworkTopology';
import { CiscoTerminal } from '../components/mission/CiscoTerminal';
import { HintSystem } from '../components/mission/HintSystem';
import { CtfQuestionCard } from '../components/mission/CtfQuestionCard';
import { FlagSubmissionCard } from '../components/mission/FlagSubmissionCard';
import { useLanguage } from '../context/LanguageContext';
import { localizeHint, localizeMission, localizeQuestion } from '../context/contentLocalization';

interface MissionRoomPageProps {
  missionId: number;
  onBackToMissions: () => void;
  onNavigateMission: (id: number) => void;
  onUserStatsUpdated?: () => void;
}

export const MissionRoomPage: React.FC<MissionRoomPageProps> = ({
  missionId,
  onBackToMissions,
  onNavigateMission,
  onUserStatsUpdated
}) => {
  const { language, t } = useLanguage();
  const [mission, setMission] = useState<Mission | null>(null);
  const [tasks, setTasks] = useState<MissionTask[]>([]);
  const [hints, setHints] = useState<Hint[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTask, setActiveTask] = useState<number>(1);
  const [completedTaskIds, setCompletedTaskIds] = useState<number[]>([1]);
  const [checklistCompleted, setChecklistCompleted] = useState<Record<number, boolean>>({});
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissionData();
  }, [missionId, language]);

  const loadMissionData = async () => {
    try {
      setLoading(true);
      const [mRes, qRes] = await Promise.all([
        api.getMission(missionId),
        api.getQuestions(missionId)
      ]);

      setMission(localizeMission(mRes.mission, language));
      setTasks(mRes.tasks);
      setHints(mRes.hints.map(h => localizeHint(h, language)));
      setQuestions(qRes.questions.map(q => localizeQuestion(q, language)));

      // Initialize completed tasks
      const completed: number[] = [1];
      if (mRes.mission.status === 'completed') {
        completed.push(1, 2, 3, 4, 5, 6);
      } else {
        // If questions solved, mark task 5 completed
        const allQuestionsSolved = qRes.questions.length > 0 && qRes.questions.every(q => q.is_correct === 1);
        if (allQuestionsSolved) {
          completed.push(2, 3, 4, 5);
        }
      }
      setCompletedTaskIds(completed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (taskOrder: number) => {
    setActiveTask(taskOrder);
    if (!completedTaskIds.includes(taskOrder - 1) && taskOrder > 1) {
      setCompletedTaskIds(prev => Array.from(new Set([...prev, taskOrder - 1])));
    }
  };

  const handleNextTask = () => {
    if (activeTask < 6) {
      const next = activeTask + 1;
      setCompletedTaskIds(prev => Array.from(new Set([...prev, activeTask])));
      setActiveTask(next);
    }
  };

  const handleAnswerSubmit = async (questionId: number, selectedAnswer: string) => {
    const res = await api.submitAnswer(missionId, questionId, selectedAnswer);
    // Reload questions and check if all answered
    const qRes = await api.getQuestions(missionId);
    setQuestions(qRes.questions.map(q => localizeQuestion(q, language)));

    const allCorrect = qRes.questions.every(q => q.is_correct === 1);
    if (allCorrect) {
      setCompletedTaskIds(prev => Array.from(new Set([...prev, 5])));
    }
    const storedQuestion = questions.find(q => q.id === questionId);
    const translated = storedQuestion
      ? localizeQuestion({ ...storedQuestion, root_cause: res.rootCause, explanation: res.explanation }, language)
      : null;
    return { ...res, rootCause: translated?.root_cause ?? res.rootCause, explanation: translated?.explanation ?? res.explanation };
  };

  const handleUnlockHint = async (hintId: number) => {
    await api.unlockHint(missionId, hintId);
    const mRes = await api.getMission(missionId);
    setHints(mRes.hints.map(h => localizeHint(h, language)));
  };

  const handleCompleteMission = async (flag: string) => {
    const res = await api.completeMission(missionId, flag);
    setCompletedTaskIds([1, 2, 3, 4, 5, 6]);
    if (mission) {
      setMission({ ...mission, status: 'completed', score: 100, xp_earned: res.xpEarned });
    }
    if (onUserStatsUpdated) {
      onUserStatsUpdated();
    }
    return res;
  };

  const handleDownloadLab = () => {
    if (!mission) return;
    const url = api.getLabDownloadUrl(mission.packet_tracer_file);
    const link = document.createElement('a');
    link.href = url;
    link.download = mission.packet_tracer_file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCompletedTaskIds(prev => Array.from(new Set([...prev, 3])));
  };

  if (loading || !mission) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#F5C542] border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-[#8D9BA8]">
            {language === 'th' ? 'กำลังเตรียมการเชื่อมต่อห้องปฏิบัติการอย่างปลอดภัย...' : 'Establishing Secure Dispatch Session...'}
          </span>
        </div>
      </div>
    );
  }

  const isAllQuestionsSolved = questions.length > 0 && questions.every(q => q.is_correct === 1);

  const taskNavItems = [
    { order: 1, title: t('room.task1'), icon: FileText },
    { order: 2, title: t('room.task2'), icon: Network },
    { order: 3, title: t('room.task3'), icon: Terminal },
    { order: 4, title: t('room.task4'), icon: Search },
    { order: 5, title: t('room.task5'), icon: HelpCircle },
    { order: 6, title: t('room.task6'), icon: Flag },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBackToMissions}
          className="flex items-center gap-2 text-xs font-mono text-[#8D9BA8] hover:text-[#F5C542] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('room.back')}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[#8D9BA8]">
          <span>{mission.stage_name}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#263241]" />
          <span className="text-[#F5C542] font-bold">{language === 'th' ? `ภารกิจที่ ${String(mission.order_index).padStart(2, '0')}` : `Mission ${String(mission.order_index).padStart(2, '0')}`}</span>
        </div>
      </div>

      {/* Main Room Layout: Two Column (Left Task Nav, Right Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* Left Column: Mission Navigation Panel (4 cols) */}
        <div className="dashboard-page-theme lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 space-y-5 lg:sticky lg:top-24">
          {/* Mission Room Header */}
          <div className="space-y-2 border-b border-[#263241] pb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#8D9BA8]">
                MISSION {String(mission.order_index).padStart(2, '0')}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                mission.difficulty === 'Easy' ? 'text-[#2ECC71] bg-[#2ECC71]/10 border-[#2ECC71]/30' :
                mission.difficulty === 'Medium' ? 'text-[#F5C542] bg-[#F5C542]/10 border-[#F5C542]/30' :
                'text-[#FF5252] bg-[#FF5252]/10 border-[#FF5252]/30'
              }`}>
                {mission.difficulty}
              </span>
            </div>

            <h2 className="text-base font-extrabold text-[#F4F6F8] leading-snug">
              {mission.title}
            </h2>

            <div className="flex items-center gap-4 text-xs font-mono text-[#8D9BA8] pt-1">
              <span className="flex items-center gap-1 text-[#00C2FF] font-bold">
                <Zap className="w-3.5 h-3.5" /> {mission.xp_reward} XP
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {mission.estimated_time}
              </span>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8D9BA8] px-2 mb-2">
              {t('room.checklist_title')}
            </div>

            {taskNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTask === item.order;
              const isCompleted = completedTaskIds.includes(item.order);

              return (
                <button
                  key={item.order}
                  id={`mission-task-nav-${item.order}`}
                  onClick={() => handleTaskClick(item.order)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#161F29] text-[#F5C542] border border-[#F5C542]/60 shadow-[0_0_15px_rgba(245,197,66,0.15)] font-bold'
                      : 'bg-[#0B0F14]/60 text-[#8D9BA8] hover:text-[#F4F6F8] hover:bg-[#161F29] border border-[#263241]/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5C542]' : 'text-[#8D9BA8]'}`} />
                    <span>{item.title}</span>
                  </div>

                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#263241] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Stats in Sidebar */}
          <div className="pt-3 border-t border-[#263241] text-xs font-mono space-y-1.5 text-[#8D9BA8]">
            <div className="flex justify-between">
              <span>{t('room.incident_id')}:</span>
              <span className="text-[#F4F6F8] font-bold">{mission.incident_id}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('room.department')}:</span>
              <span className="text-[#F4F6F8]">{mission.department}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('room.flag_status')}:</span>
              <span className={mission.status === 'completed' ? 'text-[#2ECC71] font-bold' : 'text-[#F5C542]'}>
                {mission.status === 'completed' ? t('room.captured') : t('room.pending')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Main Content Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* TASK 1: SCENARIO */}
          {activeTask === 1 && (
            <div id="task-1-scenario-panel" className="bg-[#111820] border border-[#263241] rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl animate-in fade-in">
              <div className="flex flex-col gap-3 border-b border-[#263241] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8D9BA8]">{language === 'th' ? 'ภารกิจที่ 1 จาก 6' : 'TASK 1 OF 6'}</span>
                  <h3 className="text-lg font-bold text-[#F4F6F8]">{language === 'th' ? 'รายงานเหตุการณ์และการมอบหมายงาน' : 'Incident Report & Dispatch'}</h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#FF5252]/10 border border-[#FF5252]/40 text-[#FF5252] text-xs font-mono font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {language === 'th' ? `ความสำคัญ: ${mission.priority.toUpperCase()}` : `PRIORITY: ${mission.priority.toUpperCase()}`}
                </span>
              </div>

              {/* Incident Meta Box */}
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[#0B0F14] border border-[#263241]">
                  <div className="text-[10px] font-mono text-[#8D9BA8]">{language === 'th' ? 'หมายเลขใบแจ้งงาน' : 'INCIDENT TICKET'}</div>
                  <div className="text-xs font-mono font-bold text-[#00C2FF] mt-0.5">{mission.incident_id}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#0B0F14] border border-[#263241]">
                  <div className="text-[10px] font-mono text-[#8D9BA8]">{language === 'th' ? 'หน่วยงานที่ได้รับผลกระทบ' : 'AFFECTED UNIT'}</div>
                  <div className="text-xs font-semibold text-[#F4F6F8] mt-0.5 truncate">{mission.department}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#0B0F14] border border-[#263241]">
                  <div className="text-[10px] font-mono text-[#8D9BA8]">{language === 'th' ? 'เวลาแจ้งเหตุ' : 'DISPATCH TIME'}</div>
                  <div className="text-xs font-mono text-[#F4F6F8] mt-0.5">{mission.reported_time}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#0B0F14] border border-[#263241]">
                  <div className="text-[10px] font-mono text-[#8D9BA8]">{language === 'th' ? 'เวลาโดยประมาณ' : 'ESTIMATED TIME'}</div>
                  <div className="text-xs font-mono text-[#F5C542] mt-0.5">{mission.estimated_time}</div>
                </div>
              </div>

              {/* Scenario Narrative */}
              <div className="p-5 rounded-xl bg-[#161F29]/60 border border-[#263241] space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-[#F5C542] font-bold">
                  {language === 'th' ? 'คำอธิบายสถานการณ์จำลองระบบเครือข่าย' : 'Network Operation Scenario Briefing'}
                </div>
                <p className="text-sm text-[#F4F6F8] leading-relaxed">
                  {mission.scenario_text}
                </p>
                <p className="text-xs text-[#8D9BA8] leading-relaxed">
                  {language === 'th'
                    ? 'ในฐานะวิศวกรเครือข่ายที่ได้รับมอบหมาย เป้าหมายของคุณคือการตรวจสอบแผนผังโทโพโลยีเครือข่าย เปิดไฟล์กิจกรรม Cisco Packet Tracer วิเคราะห์หาสาเหตุของปัญหา ตรวจสอบคำตอบ และส่งธงเพื่อจบภารกิจ'
                    : 'As the assigned network engineer, your goal is to inspect the network topology, open the Cisco Packet Tracer activity, troubleshoot the anomaly, verify the root cause, and capture the flag.'}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="start-investigation-btn"
                  onClick={handleNextTask}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F5C542] px-6 py-2.5 text-xs font-bold text-[#0B0F14] shadow-[0_0_15px_rgba(245,197,66,0.3)] hover:bg-[#F5C542]/90 sm:w-auto"
                >
                  <span>{t('room.start_investigation')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TASK 2: NETWORK DIAGRAM */}
          {activeTask === 2 && (
            <div id="task-2-diagram-panel" className="bg-[#111820] border border-[#263241] rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl animate-in fade-in">
              <div className="flex flex-col gap-3 border-b border-[#263241] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8D9BA8]">{language === 'th' ? 'ภารกิจที่ 2 จาก 6' : 'TASK 2 OF 6'}</span>
                  <h3 className="text-lg font-bold text-[#F4F6F8]">{language === 'th' ? 'แผนผังโทโพโลยีเครือข่าย' : 'Network Topology Diagram'}</h3>
                </div>
                <span className="text-xs font-mono text-[#8D9BA8]">{language === 'th' ? 'แผนผังอุปกรณ์จริง' : 'Live Telemetry Map'}</span>
              </div>

              <NetworkTopology topology={mission.topology} missionTitle={mission.title} />

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => setActiveTask(1)}
                  className="w-full rounded-lg bg-[#161F29] px-4 py-2 text-center font-mono text-xs text-[#8D9BA8] hover:text-[#F4F6F8] sm:w-auto"
                >
                  {language === 'th' ? 'ย้อนกลับไปที่คำอธิบาย' : 'Back to Scenario'}
                </button>
                <button
                  onClick={handleNextTask}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F5C542] px-6 py-2.5 text-xs font-bold text-[#0B0F14] shadow-[0_0_15px_rgba(245,197,66,0.3)] hover:bg-[#F5C542]/90 sm:w-auto"
                >
                  <span>{t('room.open_lab')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TASK 3: PACKET TRACER LAB */}
          {activeTask === 3 && (
            <div id="task-3-lab-panel" className="bg-[#111820] border border-[#263241] rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl animate-in fade-in">
              <div className="flex flex-col gap-3 border-b border-[#263241] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8D9BA8]">{language === 'th' ? 'ภารกิจที่ 3 จาก 6' : 'TASK 3 OF 6'}</span>
                  <h3 className="text-lg font-bold text-[#F4F6F8]">{t('room.open_lab')}</h3>
                </div>
                <span className="text-xs font-mono text-[#00C2FF] font-bold">{language === 'th' ? 'กิจกรรม Cisco Packet Tracer' : 'Cisco Packet Tracer Activity'}</span>
              </div>

              <p className="text-xs text-[#8D9BA8] leading-relaxed">
                {language === 'th'
                  ? 'ดาวน์โหลดและเปิดไฟล์แบบฝึกหัด Cisco Packet Tracer เพื่อจำลองสภาพแวดล้อมเครือข่ายที่เหมือนจริงบนคอมพิวเตอร์ของคุณ'
                  : 'Download and open the provided Cisco Packet Tracer activity file to simulate the exact network environment on your computer.'}
              </p>

              {/* Lab File Card */}
              <div className="p-5 rounded-xl bg-[#0B0F14] border border-[#263241] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center text-[#00C2FF] shrink-0">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#F4F6F8] flex items-center gap-2">
                      <span>{mission.packet_tracer_file}</span>
                      <span className="text-[10px] bg-[#00C2FF]/10 text-[#00C2FF] px-1.5 py-0.5 rounded font-mono">.PKA</span>
                    </div>
                    <div className="text-[11px] text-[#8D9BA8] mt-0.5">
                      {language === 'th' ? 'ไฟล์แล็บมาตรฐานสำหรับ Cisco Packet Tracer 8.x' : 'Standard Cisco Packet Tracer 8.x Lab Payload'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <button
                    id="download-lab-btn"
                    onClick={handleDownloadLab}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F5C542] px-4 py-2 text-xs font-bold text-[#0B0F14] shadow-[0_0_15px_rgba(245,197,66,0.3)] hover:bg-[#F5C542]/90 sm:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('room.download_lab')}</span>
                  </button>

                  <button
                    id="open-instructions-btn"
                    onClick={() => setShowInstructionsModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#263241] bg-[#161F29] px-4 py-2 text-xs font-medium text-[#F4F6F8] transition-colors hover:bg-[#263241] sm:w-auto"
                  >
                    <FileText className="w-4 h-4 text-[#8D9BA8]" />
                    <span>{t('room.open_instructions')}</span>
                  </button>
                </div>
              </div>

              {/* Packet Tracer Notice Box */}
              <div className="p-4 rounded-xl bg-[#161F29]/60 border border-[#263241] flex items-start gap-3">
                <Info className="w-5 h-5 text-[#00C2FF] shrink-0 mt-0.5" />
                <div className="text-xs text-[#8D9BA8] space-y-1">
                  <span className="font-bold text-[#F4F6F8]">{language === 'th' ? 'ข้อกำหนดของโปรแกรม Cisco Packet Tracer:' : 'Cisco Packet Tracer Requirement:'}</span>
                  <p>
                    {t('room.packet_tracer_notice')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => setActiveTask(2)}
                  className="w-full rounded-lg bg-[#161F29] px-4 py-2 text-center font-mono text-xs text-[#8D9BA8] hover:text-[#F4F6F8] sm:w-auto"
                >
                  {language === 'th' ? 'ย้อนกลับไปแผนผัง' : 'Back to Diagram'}
                </button>
                <button
                  onClick={handleNextTask}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F5C542] px-6 py-2.5 text-xs font-bold text-[#0B0F14] shadow-[0_0_15px_rgba(245,197,66,0.3)] hover:bg-[#F5C542]/90 sm:w-auto"
                >
                  <span>{language === 'th' ? 'เข้าสู่ขั้นตอนตรวจสอบ' : 'Go to Investigation'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TASK 4: INVESTIGATION */}
          {activeTask === 4 && (
            <div id="task-4-investigation-panel" className="bg-[#111820] border border-[#263241] rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl animate-in fade-in">
              <div className="flex flex-col gap-3 border-b border-[#263241] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8D9BA8]">{language === 'th' ? 'ภารกิจที่ 4 จาก 6' : 'TASK 4 OF 6'}</span>
                  <h3 className="text-lg font-bold text-[#F4F6F8]">{language === 'th' ? 'การสืบสวนและแก้ไขปัญหา' : 'Investigation & Troubleshooting'}</h3>
                </div>
                <span className="text-xs font-mono text-[#F5C542] font-bold">{language === 'th' ? 'รายการตรวจสอบ' : 'Diagnostic Checklist'}</span>
              </div>

              {/* Objectives Checklist */}
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-[#8D9BA8]">
                  {t('room.step_objectives')}
                </div>
                <div className="space-y-2">
                  {(mission.checklists || []).map((step, idx) => {
                    const isChecked = !!checklistCompleted[idx];
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-[#2ECC71]/5 border-[#2ECC71]/30 text-[#F4F6F8]'
                            : 'bg-[#0B0F14] border-[#263241] text-[#8D9BA8] hover:border-[#8D9BA8]/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setChecklistCompleted(prev => ({ ...prev, [idx]: e.target.checked }))}
                          className="mt-0.5 rounded border-[#263241] text-[#F5C542] focus:ring-0"
                        />
                        <span className={`text-xs leading-relaxed ${isChecked ? 'line-through text-[#8D9BA8]' : ''}`}>
                          {step}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Cisco Simulated CLI Console */}
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#8D9BA8]">
                  {t('room.simulated_cli')}
                </div>
                <CiscoTerminal mission={mission} />
              </div>

              {/* 3-Tier Hint System */}
              <HintSystem
                hints={hints}
                maxReward={mission.xp_reward}
                onUnlockHint={handleUnlockHint}
              />

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => setActiveTask(3)}
                  className="w-full rounded-lg bg-[#161F29] px-4 py-2 text-center font-mono text-xs text-[#8D9BA8] hover:text-[#F4F6F8] sm:w-auto"
                >
                  {language === 'th' ? 'ย้อนกลับไปไฟล์แล็บ' : 'Back to Lab'}
                </button>
                <button
                  onClick={handleNextTask}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F5C542] px-6 py-2.5 text-xs font-bold text-[#0B0F14] shadow-[0_0_15px_rgba(245,197,66,0.3)] hover:bg-[#F5C542]/90 sm:w-auto"
                >
                  <span>{language === 'th' ? 'ตอบคำถามทบทวน' : 'Answer CTF Questions'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TASK 5: QUESTIONS */}
          {activeTask === 5 && (
            <div id="task-5-questions-panel" className="bg-[#111820] border border-[#263241] rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl animate-in fade-in">
              <div className="flex flex-col gap-3 border-b border-[#263241] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8D9BA8]">{language === 'th' ? 'ภารกิจที่ 5 จาก 6' : 'TASK 5 OF 6'}</span>
                  <h3 className="text-lg font-bold text-[#F4F6F8]">{language === 'th' ? 'การยืนยันความรู้เชิงเทคนิค CTF' : 'CTF Knowledge Verification'}</h3>
                </div>
                <span className="text-xs font-mono text-[#00C2FF]">
                  {questions.filter(q => q.is_correct === 1).length} {language === 'th' ? 'จาก' : 'of'} {questions.length} {language === 'th' ? 'ข้อที่ถูก' : 'Solved'}
                </span>
              </div>

              {/* Questions List */}
              <div className="space-y-5">
                {questions.map((q, idx) => (
                  <CtfQuestionCard
                    key={q.id}
                    question={q}
                    index={idx}
                    totalQuestions={questions.length}
                    onSubmitAnswer={handleAnswerSubmit}
                  />
                ))}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#263241] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => setActiveTask(4)}
                  className="w-full rounded-lg bg-[#161F29] px-4 py-2 text-center font-mono text-xs text-[#8D9BA8] hover:text-[#F4F6F8] sm:w-auto"
                >
                  {language === 'th' ? 'ย้อนกลับไปการสืบสวน' : 'Back to Investigation'}
                </button>

                <button
                  onClick={handleNextTask}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F5C542] px-6 py-2.5 text-xs font-bold text-[#0B0F14] shadow-[0_0_15px_rgba(245,197,66,0.3)] hover:bg-[#F5C542]/90 sm:w-auto"
                >
                  <span>{language === 'th' ? 'ไปหน้าส่งธง' : 'Proceed to Capture the Flag'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TASK 6: CAPTURE THE FLAG */}
          {activeTask === 6 && (
            <div id="task-6-flag-panel" className="animate-in fade-in">
              <FlagSubmissionCard
                mission={mission}
                isAllQuestionsSolved={isAllQuestionsSolved}
                onCompleteMission={handleCompleteMission}
                onNextMission={() => {
                  onNavigateMission(mission.order_index + 1);
                }}
              />
            </div>
          )}

        </div>

      </div>

      {/* Lab Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111820] border border-[#263241] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#263241] pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#F5C542]" />
                <h4 className="text-sm font-bold text-[#F4F6F8]">
                  {language === 'th' ? 'คำแนะนำการใช้งาน Cisco Packet Tracer' : 'Cisco Packet Tracer Instructions'}
                </h4>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="text-[#8D9BA8] hover:text-[#F4F6F8] text-xs font-mono"
              >
                ✕ {language === 'th' ? 'ปิด' : 'Close'}
              </button>
            </div>

            <div className="text-xs text-[#8D9BA8] space-y-3 leading-relaxed font-mono">
              <p className="text-[#F4F6F8]">
                {language === 'th' 
                  ? '1. ตรวจสอบให้แน่ใจว่าติดตั้งโปรแกรม Cisco Packet Tracer เวอร์ชัน 8.0 ขึ้นไปบนเครื่องของคุณ'
                  : '1. Ensure Cisco Packet Tracer 8.0 or newer is installed on your workstation.'}
              </p>
              <p>
                {language === 'th'
                  ? `2. กดปุ่ม "ดาวน์โหลดแล็บ" เพื่อดาวน์โหลดไฟล์ ${mission.packet_tracer_file}`
                  : `2. Click "Download Lab" to retrieve ${mission.packet_tracer_file}.`}
              </p>
              <p>
                {language === 'th'
                  ? '3. ดับเบิลคลิกไฟล์ .pka เพื่อเปิดโทโพโลยีเครือข่ายจำลองใน Packet Tracer'
                  : '3. Double-click the .pka file to open the pre-configured network topology inside Packet Tracer.'}
              </p>
              <p>
                {language === 'th'
                  ? '4. ทำตามสรุปสถานการณ์: ตรวจสอบ IP, ตรวจ Default Gateway, ตรวจ VLAN บน Switch และทดสอบ ping'
                  : '4. Follow the incident brief: inspect IP addresses, verify default gateways, check switch VLAN assignments, and test reachability with ping.'}
              </p>
              <p>
                {language === 'th'
                  ? '5. เมื่อแก้ไขจุดบกพร่องได้แล้ว ให้กลับมาที่ห้องภารกิจนี้เพื่อตอบคำถามและส่งธงเพื่อรับ XP!'
                  : '5. Once the defect is isolated and resolved in Packet Tracer, return to this Mission Room to complete the verification questions and submit your flag!'}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="px-4 py-2 rounded-lg bg-[#F5C542] text-[#0B0F14] font-bold text-xs"
              >
                {language === 'th' ? 'รับทราบ กลับสู่ห้องภารกิจ' : 'Understood, Return to Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
