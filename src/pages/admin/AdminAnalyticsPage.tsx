import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, BrainCircuit, Clock3, Gauge, Lightbulb, RefreshCw, Target, Users } from 'lucide-react';
import { api } from '../../services/api';
import type { AdminAnalyticsData } from '../../types';
import { AnalyticsBarChart, AnalyticsLineChart } from '../../components/admin/AdminAnalyticsCharts';

const panel = 'rounded-[20px] border border-slate-700/70 bg-[#111827]/90 p-5 shadow-[0_18px_50px_rgba(0,0,0,.22)] sm:p-6';
const percent = (value: number | null) => value == null ? '—' : `${value.toFixed(1)}%`;
const minutes = (seconds: number) => seconds <= 0 ? '0 นาที' : `${(seconds / 60).toFixed(seconds < 600 ? 1 : 0)} นาที`;

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError('');
    try { setData(await api.getAdminAnalytics()); } catch (err) { setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><RefreshCw className="h-8 w-8 animate-spin text-cyan-300" aria-label="กำลังโหลด"/></div>;
  if (!data) return <div className={`${panel} border-red-500/40 text-red-200`}><p>{error}</p><button onClick={() => void load()} className="mt-4 rounded-xl bg-red-500/15 px-4 py-2 text-sm font-bold">ลองใหม่</button></div>;

  const cards = [
    ['Pre-Test เฉลี่ย', percent(data.metrics.averagePreTestScore), BrainCircuit, 'text-cyan-300'],
    ['Post-Test เฉลี่ย', percent(data.metrics.averagePostTestScore), Target, 'text-violet-300'],
    ['พัฒนาการเฉลี่ย', data.metrics.averageImprovement == null ? '—' : `${data.metrics.averageImprovement >= 0 ? '+' : ''}${data.metrics.averageImprovement.toFixed(1)} จุด`, Gauge, 'text-emerald-300'],
    ['อัตราสำเร็จภารกิจ', percent(data.metrics.missionCompletionRate), BarChart3, 'text-blue-300'],
    ['เวลาเรียนเฉลี่ย', minutes(data.metrics.averageActiveLearningSeconds), Clock3, 'text-amber-300'],
    ['เวลาสำเร็จภารกิจ', data.metrics.averageMissionCompletionMinutes == null ? '—' : `${data.metrics.averageMissionCompletionMinutes.toFixed(1)} นาที`, Activity, 'text-orange-300'],
    ['อัตราการใช้คำใบ้', percent(data.metrics.hintUsageRate), Lightbulb, 'text-fuchsia-300'],
  ] as const;

  return <div className="space-y-6">
    <header className="relative overflow-hidden rounded-[24px] border border-cyan-400/20 bg-gradient-to-br from-[#111C31] via-[#101827] to-[#171229] p-6 sm:p-8">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"/>
      <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300"><BarChart3 className="h-4 w-4"/> REAL DATA • 30 DAYS</div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">Learning Analytics</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">วิเคราะห์การเรียนรู้จากกิจกรรม ภารกิจ แบบประเมิน และเวลาที่ผู้เรียนใช้งานจริง</p></div><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/70 px-4 py-2.5 text-sm font-bold hover:border-cyan-400/50"><RefreshCw className="h-4 w-4"/>รีเฟรชข้อมูล</button></div>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon, color]) => <article key={label} className="rounded-2xl border border-slate-700/70 bg-[#111827]/90 p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-400">{label}</p><Icon className={`h-5 w-5 ${color}`}/></div><p className="mt-3 font-mono text-2xl font-black text-white">{value}</p></article>)}</section>

    <section className="grid gap-6 xl:grid-cols-2"><article className={panel}><h2 className="text-lg font-black">ผู้เรียนที่มีกิจกรรม — 30 วัน</h2><p className="mt-1 text-sm text-slate-500">ผู้เรียนไม่ซ้ำที่มี Activity Log ในแต่ละวัน</p><AnalyticsLineChart data={data.activeUsers30Days} valueLabel="จำนวนผู้เรียนที่มีกิจกรรม"/></article><article className={panel}><h2 className="text-lg font-black">เวลาเรียนจริงต่อวัน</h2><p className="mt-1 text-sm text-slate-500">รวม Active Learning Time หน่วยนาที</p><AnalyticsLineChart data={data.activeLearningTime30Days} valueLabel="เวลาเรียนจริงต่อวัน" color="#8B5CF6"/></article></section>

    <section className="grid gap-6 xl:grid-cols-3"><article className={panel}><h2 className="text-lg font-black">สำเร็จตามหมวดหมู่</h2><AnalyticsBarChart data={data.completionByCategory.map(x => ({ label: x.category, value: x.completionRate }))}/></article><article className={panel}><h2 className="text-lg font-black">Pre-Test เทียบ Post-Test</h2><p className="mt-1 text-xs text-slate-500">ผู้เข้าร่วม {data.metrics.assessmentParticipants} คน • มีผลครบคู่ {data.metrics.pairedParticipants} คน</p><AnalyticsBarChart data={data.assessmentComparison.map(x => ({ label: x.label, value: x.value ?? 0 }))} colorClass="from-violet-400 to-cyan-400"/></article><article className={panel}><h2 className="text-lg font-black">การกระจายความคืบหน้า</h2><AnalyticsBarChart data={data.progressDistribution} suffix=" คน" colorClass="from-emerald-400 to-cyan-400"/></article></section>

    <section className="grid gap-6 xl:grid-cols-2"><article className={panel}><h2 className="text-lg font-black">การใช้คำใบ้ตามภารกิจ</h2><AnalyticsBarChart data={data.hintUsageByMission.slice(0, 8)} colorClass="from-amber-400 to-orange-500"/></article><article className={panel}><h2 className="text-lg font-black">ภารกิจที่ยากที่สุด</h2><p className="mt-1 text-xs leading-5 text-slate-500">Difficulty Score = ช่องว่างอัตราสำเร็จ 60% + การใช้คำใบ้ 25% + ตอบคำถามผิด 15%</p><div className="mt-5 space-y-3">{data.mostDifficultMissions.length ? data.mostDifficultMissions.map((mission, i) => <div key={mission.missionId} className="flex items-center gap-4 rounded-xl border border-slate-700/60 bg-slate-900/60 p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-400/10 font-mono font-black text-orange-300">{i+1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{mission.title}</p><p className="mt-1 text-xs text-slate-500">สำเร็จ {mission.completionRate}% • คำใบ้ {mission.hintUsageRate}% • {mission.attempts} attempts</p></div><span className="font-mono font-black text-orange-300">{mission.difficultyScore}</span></div>) : <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">ยังไม่มีข้อมูลการทำภารกิจ</p>}</div></article></section>

    <section className={panel}><div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-cyan-300"/><h2 className="text-lg font-black">Mission Performance</h2></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-500"><th className="px-3 py-3">Mission</th><th className="px-3 py-3">Completion Rate</th><th className="px-3 py-3">Average Time</th><th className="px-3 py-3">Hint Usage</th><th className="px-3 py-3">Attempts</th><th className="px-3 py-3">Average Score</th></tr></thead><tbody>{data.missionPerformance.map(m => <tr key={m.missionId} className="border-b border-slate-800 hover:bg-cyan-400/[.03]"><td className="px-3 py-4"><p className="font-bold text-white">{m.title}</p><p className="mt-1 text-xs text-slate-500">{m.category}</p></td><td className="px-3 py-4 font-mono text-emerald-300">{m.completionRate}%</td><td className="px-3 py-4 font-mono">{m.averageTimeMinutes == null ? '—' : `${m.averageTimeMinutes} min`}</td><td className="px-3 py-4 font-mono text-amber-300">{m.hintUsageRate}%</td><td className="px-3 py-4 font-mono">{m.attempts}</td><td className="px-3 py-4 font-mono text-cyan-300">{m.averageScore}%</td></tr>)}</tbody></table>{!data.missionPerformance.length && <p className="py-10 text-center text-slate-500">ยังไม่มีภารกิจที่เผยแพร่</p>}</div></section>

    <section className={panel}><div className="flex items-center gap-3"><Users className="h-5 w-5 text-fuchsia-300"/><h2 className="text-lg font-black">คำถามที่ผู้เรียนตอบผิดบ่อย</h2></div><div className="mt-5 grid gap-3 md:grid-cols-2">{data.failedQuestions.length ? data.failedQuestions.map(q => <div key={q.id} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4"><div className="flex items-start justify-between gap-4"><p className="text-sm font-bold leading-6">{q.question}</p><span className="shrink-0 rounded-full bg-rose-400/10 px-2.5 py-1 font-mono text-xs font-bold text-rose-300">{q.failureRate}%</span></div><p className="mt-2 text-xs text-slate-500">{q.mission} • ผิด {q.failures}/{q.attempts} ครั้ง</p></div>) : <p className="text-sm text-slate-500">ยังไม่มี Activity Log การตอบคำถาม</p>}</div></section>
  </div>;
};
