import React, { useEffect, useState } from 'react';
import {
  Activity, ArrowUpRight, BarChart3, BookOpenCheck, CheckCircle2, Clock3,
  Flag, Gauge, Lightbulb, LogIn, RefreshCw, ShieldCheck, Target, Users,
  UserRoundCheck, Wifi,
} from 'lucide-react';
import { AdminActivityChart } from '../../components/admin/AdminActivityChart';
import { AdminKpiCard } from '../../components/admin/AdminKpiCard';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import type { AdminDashboardData } from '../../types';

const percent = (value: number | null) => value === null ? '—' : `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
const formatLearningTime = (seconds: number, th: boolean) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours.toLocaleString()} ${th ? 'ชม.' : 'hr'} ${minutes} ${th ? 'นาที' : 'min'}`;
  if (minutes > 0) return `${minutes.toLocaleString()} ${th ? 'นาที' : 'min'}`;
  return `${seconds.toLocaleString()} ${th ? 'วินาที' : 'sec'}`;
};

export const AdminDashboardPage: React.FC = () => {
  const { language } = useLanguage();
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      setDashboard(await api.getAdminDashboard());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadDashboard(); }, []);

  if (loading) {
    return <div className="grid min-h-[55vh] place-items-center"><RefreshCw className="h-8 w-8 animate-spin text-cyan-300" aria-label="Loading" /></div>;
  }

  if (!dashboard || error) {
    return (
      <section className="rounded-3xl border border-red-400/20 bg-red-400/[0.06] p-8 text-center">
        <p className="font-bold text-red-200">{language === 'th' ? 'โหลดข้อมูลแดชบอร์ดไม่สำเร็จ' : 'Dashboard could not be loaded'}</p>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <button type="button" onClick={() => void loadDashboard()} className="mt-5 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">{language === 'th' ? 'ลองอีกครั้ง' : 'Try again'}</button>
      </section>
    );
  }

  const th = language === 'th';
  const kpis = [
    { label: th ? 'ผู้ใช้ทั้งหมด' : 'Total Users', value: dashboard.kpis.totalUsers.toLocaleString(), note: th ? 'บัญชีทั้งหมดในระบบ' : 'All accounts in the system', icon: Users, tone: 'cyan' as const },
    { label: th ? 'ผู้ใช้ออนไลน์' : 'Online Users', value: dashboard.kpis.onlineUsers.toLocaleString(), note: th ? 'มีกิจกรรมภายใน 5 นาทีล่าสุด' : 'Active within the last 5 minutes', icon: Wifi, tone: 'emerald' as const },
    { label: th ? 'ผู้ใช้ที่ใช้งานวันนี้' : 'Active Users Today', value: dashboard.kpis.activeUsersToday.toLocaleString(), note: th ? 'บัญชีที่มีกิจกรรมในวันนี้' : 'Accounts with activity today', icon: UserRoundCheck, tone: 'blue' as const },
    { label: th ? 'เวลาเรียนที่ใช้งานรวม' : 'Total Active Learning Time', value: formatLearningTime(dashboard.kpis.totalActiveLearningSeconds, th), note: th ? 'นับเฉพาะช่วงที่กำลังเรียนและมีปฏิสัมพันธ์' : 'Only visible, interactive learning time', icon: Clock3, tone: 'violet' as const },
    { label: th ? 'ภารกิจที่สำเร็จทั้งหมด' : 'Mission Completions', value: dashboard.kpis.totalMissionCompletions.toLocaleString(), note: th ? 'การผ่านภารกิจของผู้เรียน' : 'Learner mission completions', icon: BookOpenCheck, tone: 'amber' as const },
    { label: th ? 'ธงที่ยึดได้ทั้งหมด' : 'Flags Captured', value: dashboard.kpis.totalFlagsCaptured.toLocaleString(), note: th ? 'ธงที่ผ่านการตรวจสอบสำเร็จ' : 'Successfully verified flags', icon: Flag, tone: 'rose' as const },
  ];

  const activityMeta: Record<AdminDashboardData['recentActivity'][number]['eventType'], { icon: typeof Activity; label: string; color: string }> = {
    LOGIN: { icon: LogIn, label: th ? 'เข้าสู่ระบบ' : 'User logged in', color: 'text-cyan-300 bg-cyan-400/10 border-cyan-300/20' },
    LOGOUT: { icon: LogIn, label: th ? 'ออกจากระบบ' : 'User logged out', color: 'text-slate-300 bg-slate-400/10 border-slate-300/20' },
    MISSION_STARTED: { icon: Target, label: th ? 'เริ่มภารกิจ' : 'Mission started', color: 'text-blue-300 bg-blue-400/10 border-blue-300/20' },
    MISSION_COMPLETED: { icon: CheckCircle2, label: th ? 'ทำภารกิจสำเร็จ' : 'Mission completed', color: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20' },
    QUESTION_ANSWERED: { icon: Gauge, label: th ? 'ตอบคำถามภารกิจ' : 'Question answered', color: 'text-violet-300 bg-violet-400/10 border-violet-300/20' },
    FLAG_CAPTURED: { icon: Flag, label: th ? 'ยึดธงสำเร็จ' : 'Flag captured', color: 'text-rose-300 bg-rose-400/10 border-rose-300/20' },
    HINT_USED: { icon: Lightbulb, label: th ? 'ใช้คำใบ้' : 'Hint used', color: 'text-amber-300 bg-amber-400/10 border-amber-300/20' },
    PRETEST_COMPLETED: { icon: Gauge, label: th ? 'ทำแบบทดสอบก่อนเรียนเสร็จ' : 'Pre-Test completed', color: 'text-violet-300 bg-violet-400/10 border-violet-300/20' },
    POSTTEST_COMPLETED: { icon: Gauge, label: th ? 'ทำแบบทดสอบหลังเรียนเสร็จ' : 'Post-Test completed', color: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20' },
    PACKET_TRACER_DOWNLOADED: { icon: BookOpenCheck, label: th ? 'ดาวน์โหลดแล็บ Packet Tracer' : 'Packet Tracer lab downloaded', color: 'text-cyan-300 bg-cyan-400/10 border-cyan-300/20' },
    ACCOUNT_ENABLED: { icon: Users, label: th ? 'เปิดใช้งานบัญชี' : 'Account enabled', color: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20' },
    ACCOUNT_DISABLED: { icon: Users, label: th ? 'ปิดใช้งานบัญชี' : 'Account disabled', color: 'text-red-300 bg-red-400/10 border-red-300/20' },
    ROLE_CHANGED: { icon: ShieldCheck, label: th ? 'เปลี่ยน Role ผู้ใช้' : 'User role changed', color: 'text-violet-300 bg-violet-400/10 border-violet-300/20' },
    XP_ADJUSTED: { icon: Gauge, label: th ? 'ปรับ XP ผู้ใช้' : 'User XP adjusted', color: 'text-amber-300 bg-amber-400/10 border-amber-300/20' },
    PASSWORD_RESET_REQUESTED: { icon: ShieldCheck, label: th ? 'สร้างลิงก์ Reset Password' : 'Password reset requested', color: 'text-cyan-300 bg-cyan-400/10 border-cyan-300/20' },
    PASSWORD_RESET_COMPLETED: { icon: ShieldCheck, label: th ? 'เปลี่ยน Password สำเร็จ' : 'Password reset completed', color: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20' },
    PROGRESS_RESET: { icon: BookOpenCheck, label: th ? 'รีเซ็ตความคืบหน้า' : 'Learning progress reset', color: 'text-red-300 bg-red-400/10 border-red-300/20' },
  };

  const panel = 'rounded-3xl border border-slate-700/60 bg-slate-900/65 p-5 shadow-2xl backdrop-blur-xl sm:p-6';

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-[radial-gradient(circle_at_85%_0%,rgba(34,211,238,0.13),transparent_28rem),linear-gradient(135deg,rgba(30,41,59,0.9),rgba(11,18,32,0.96))] p-6 shadow-2xl sm:p-8">
        <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#67e8f9_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/[0.08] px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.16em] text-cyan-300"><ShieldCheck className="h-4 w-4" /> LIVE SYSTEM OVERVIEW</div>
            <h2 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">{th ? 'ภาพรวมระบบ Network CTF' : 'Network CTF System Overview'}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{th ? 'ติดตามผู้เรียน ผลการเรียนรู้ และประสิทธิภาพภารกิจจากข้อมูลจริงในระบบ' : 'Monitor learners, learning outcomes, and mission performance from live project data.'}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500"><Activity className="h-4 w-4 text-emerald-300" />{th ? 'อัปเดตล่าสุด' : 'Updated'} {new Intl.DateTimeFormat(th ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dashboard.generatedAt))}</div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{kpis.map((item) => <AdminKpiCard key={item.label} {...item} />)}</section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <article className={panel}>
          <div className="flex items-start justify-between gap-4">
            <div><p className="font-mono text-[10px] font-bold tracking-[0.18em] text-cyan-300">USER ACTIVITY</p><h3 className="mt-1 text-xl font-black text-white">{th ? 'แนวโน้มกิจกรรม 7 วันล่าสุด' : 'Activity trend — last 7 days'}</h3></div>
            <BarChart3 className="h-6 w-6 text-cyan-300" />
          </div>
          <AdminActivityChart data={dashboard.activityTrend} language={language} />
          <p className="mt-4 text-xs leading-5 text-slate-500">{th ? 'รวมกิจกรรมจากการสมัคร เข้าใช้งาน ทำแบบประเมิน ใช้คำใบ้ และสำเร็จภารกิจ' : 'Includes registration, account activity, assessments, hints, and mission completions.'}</p>
        </article>

        <article className={panel}>
          <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-violet-300">LEARNING PERFORMANCE</p>
          <h3 className="mt-1 text-xl font-black text-white">{th ? 'ผลการเรียนรู้' : 'Learning Performance'}</h3>
          <div className="mt-5 space-y-3">
            {[
              [th ? 'คะแนนก่อนเรียนเฉลี่ย' : 'Average Pre-Test Score', dashboard.learningPerformance.averagePreTestScore, 'text-cyan-300'],
              [th ? 'คะแนนหลังเรียนเฉลี่ย' : 'Average Post-Test Score', dashboard.learningPerformance.averagePostTestScore, 'text-violet-300'],
              [th ? 'พัฒนาการเฉลี่ย' : 'Average Improvement', dashboard.learningPerformance.averageImprovement, 'text-emerald-300'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4">
                <span className="text-sm font-semibold text-slate-400">{label}</span>
                <span className={`font-mono text-xl font-black ${color}`}>{percent(value as number | null)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">{th ? 'คำนวณจากผลแบบทดสอบล่าสุดของผู้เรียนแต่ละคน เครื่องหมาย — หมายถึงยังไม่มีข้อมูล' : 'Based on each learner’s latest result. — means no data is available.'}</p>
        </article>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.6fr_1fr]">
        <article className={`${panel} overflow-hidden p-0 sm:p-0`}>
          <div className="flex items-center justify-between gap-4 border-b border-slate-700/60 p-5 sm:p-6">
            <div><p className="font-mono text-[10px] font-bold tracking-[0.18em] text-amber-300">MISSION PERFORMANCE</p><h3 className="mt-1 text-xl font-black text-white">{th ? 'ประสิทธิภาพภารกิจ' : 'Mission Performance'}</h3></div>
            <Target className="h-6 w-6 text-amber-300" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-950/45 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">{th ? 'ภารกิจ' : 'Mission'}</th><th className="px-4 py-4">{th ? 'อัตราสำเร็จ' : 'Completion Rate'}</th><th className="px-4 py-4">{th ? 'เวลาเฉลี่ย' : 'Average Time'}</th><th className="px-6 py-4">{th ? 'การใช้คำใบ้' : 'Hint Usage'}</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {dashboard.missionPerformance.map((mission) => (
                  <tr key={mission.missionId} className="transition hover:bg-cyan-400/[0.035]">
                    <td className="max-w-sm px-6 py-4"><p className="truncate text-sm font-bold text-slate-200">{mission.mission}</p><p className="mt-1 font-mono text-[10px] text-slate-600">MISSION {String(mission.missionId).padStart(2, '0')}</p></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${Math.min(100, mission.completionRate)}%` }} /></div><span className="font-mono text-xs font-bold text-cyan-300">{percent(mission.completionRate)}</span></div></td>
                    <td className="px-4 py-4 font-mono text-xs font-bold text-slate-400">{mission.averageTimeMinutes === null ? '—' : `${mission.averageTimeMinutes} ${th ? 'นาที' : 'min'}`}</td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-amber-300">{percent(mission.hintUsage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!dashboard.dataAvailability.missionAverageTime && <p className="border-t border-slate-800 px-6 py-3 text-xs text-slate-500">{th ? 'เวลาเฉลี่ยแสดง — เนื่องจากระบบยังไม่ได้บันทึกเวลาเริ่มและจบภารกิจ' : 'Average time shows — because mission start/end timing is not tracked yet.'}</p>}
        </article>

        <article className={panel}>
          <div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] font-bold tracking-[0.18em] text-emerald-300">RECENT ACTIVITY</p><h3 className="mt-1 text-xl font-black text-white">{th ? 'กิจกรรมล่าสุด' : 'Recent Activity'}</h3></div><ArrowUpRight className="h-5 w-5 text-slate-500" /></div>
          <div className="mt-5 space-y-1">
            {dashboard.recentActivity.length === 0 && <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">{th ? 'ยังไม่มีกิจกรรมในระบบ' : 'No activity yet'}</p>}
            {dashboard.recentActivity.map((activity) => {
              const meta = activityMeta[activity.eventType];
              const Icon = meta.icon;
              return (
                <div key={activity.id} className="flex gap-3 rounded-2xl p-3 transition hover:bg-white/[0.025]">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${meta.color}`}><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-sm font-bold text-slate-200">{meta.label}</p><time className="shrink-0 font-mono text-[9px] text-slate-600">{new Intl.DateTimeFormat(th ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(activity.createdAt))}</time></div><p className="mt-1 truncate text-xs text-slate-500"><span className="text-slate-400">{activity.username}</span>{activity.mission ? ` · ${activity.mission}` : activity.assessmentType ? ` · ${activity.assessmentType}` : ''}</p></div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
};
