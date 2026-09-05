import React, { useEffect, useState } from 'react';
import {
  Activity, ArrowLeft, Award, BookOpenCheck, CheckCircle2, Clock3, Copy, Flag,
  Gauge, KeyRound, Lightbulb, RefreshCw, RotateCcw, Save, Shield, UserCheck, UserX, Zap,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminConfirmationModal } from '../../components/admin/AdminConfirmationModal';
import { api } from '../../services/api';
import type { AdminUserDetailData } from '../../types';

const duration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours} ชม. ${minutes} นาที`;
  if (minutes) return `${minutes} นาที`;
  return `${Math.round(seconds)} วินาที`;
};
const score = (value: number | null) => value === null ? '—' : `${value}%`;
const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

type Confirmation = { title: string; description: string; label: string; destructive?: boolean; action: () => Promise<void> };

export const AdminUserDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = Number(id);
  const [data, setData] = useState<AdminUserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [xp, setXp] = useState('0');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [resetUrl, setResetUrl] = useState('');
  const [notice, setNotice] = useState('');

  const loadUser = async () => {
    if (!Number.isInteger(userId) || userId <= 0) { setError('รหัสผู้ใช้ไม่ถูกต้อง'); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const response = await api.getAdminUser(userId);
      setData(response);
      setXp(String(response.user.xp));
      setRole(response.user.role);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูลไม่สำเร็จ');
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadUser(); }, [userId]);

  const perform = async (message: string, action: () => Promise<unknown>) => {
    setNotice('');
    try { await action(); setNotice(message); await loadUser(); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'ดำเนินการไม่สำเร็จ'); throw actionError; }
  };

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><RefreshCw className="h-8 w-8 animate-spin text-cyan-300" /></div>;
  if (!data) return <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center text-red-300">{error || 'ไม่พบผู้ใช้งาน'}<button type="button" onClick={() => navigate('/admin/users')} className="mx-auto mt-5 block rounded-xl bg-slate-800 px-4 py-2 text-white">กลับหน้าผู้ใช้งาน</button></div>;

  const { user } = data;
  const panel = 'rounded-3xl border border-slate-700/60 bg-slate-900/65 p-5 shadow-xl sm:p-6';
  const statCards = [
    ['Level', String(user.level), Award, 'text-blue-300'], ['XP', user.xp.toLocaleString(), Zap, 'text-amber-300'],
    ['Flags Captured', String(user.flagsCaptured), Flag, 'text-rose-300'], ['Completed Missions', String(user.completedMissions), CheckCircle2, 'text-emerald-300'],
    ['Total Learning Time', duration(user.totalLearningTime), Clock3, 'text-cyan-300'], ['Learning Time This Week', duration(user.learningTimeThisWeek), Activity, 'text-violet-300'],
    ['Average Session Time', duration(user.averageSessionTime), Gauge, 'text-cyan-300'],
  ] as const;

  return (
    <div className="space-y-6 pb-8">
      <button type="button" onClick={() => navigate('/admin/users')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-300"><ArrowLeft className="h-4 w-4" />กลับหน้าผู้ใช้งาน</button>
      <section className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-slate-800/95 to-slate-950 p-6 shadow-2xl sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 text-xl font-black text-cyan-300">{user.username.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-2xl font-black text-white sm:text-3xl">{user.username}</h2><span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${user.is_active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>{user.is_active ? 'ACTIVE' : 'INACTIVE'}</span></div><p className="mt-1 truncate text-sm text-slate-400">{user.email}</p><p className="mt-2 text-xs text-slate-500">ใช้งานล่าสุด {dateTime(user.last_activity)}</p></div></div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/10 px-3 py-2 font-mono text-xs font-bold text-violet-300"><Shield className="h-4 w-4" />{user.role.toUpperCase()}</span>
        </div>
      </section>

      {(notice || error) && <div className={`rounded-2xl border p-4 text-sm ${error ? 'border-red-400/20 bg-red-400/10 text-red-300' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'}`}>{error || notice}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map(([label, value, Icon, color]) => <article key={label} className="rounded-2xl border border-slate-700/60 bg-slate-900/65 p-5 shadow-lg"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className={`mt-3 font-mono text-xl font-black ${color}`}>{value}</p></div><Icon className={`h-5 w-5 ${color}`} /></div></article>)}</section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className={panel}>
          <h3 className="text-lg font-black text-white">การจัดการบัญชี</h3><p className="mt-1 text-xs text-slate-500">การดำเนินการสำคัญต้องยืนยันก่อนบันทึก</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4"><label className="text-xs font-bold text-slate-400">Role</label><div className="mt-2 flex gap-2"><select value={role} onChange={(event) => setRole(event.target.value as 'user' | 'admin')} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm"><option value="user">USER</option><option value="admin">ADMIN</option></select><button type="button" disabled={role === user.role} onClick={() => setConfirmation({ title: 'ยืนยันการเปลี่ยน Role', description: `เปลี่ยน Role ของ ${user.username} จาก ${user.role.toUpperCase()} เป็น ${role.toUpperCase()}`, label: 'เปลี่ยน Role', action: () => perform('เปลี่ยน Role สำเร็จ', () => api.setAdminUserRole(userId, role)) })} className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white disabled:opacity-30"><Save className="h-4 w-4" /></button></div></div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4"><label className="text-xs font-bold text-slate-400">ปรับ XP</label><div className="mt-2 flex gap-2"><input type="number" min="0" max="10000000" value={xp} onChange={(event) => setXp(event.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 font-mono text-sm" /><button type="button" disabled={!Number.isInteger(Number(xp)) || Number(xp) < 0 || Number(xp) === user.xp} onClick={() => void perform('ปรับ XP สำเร็จ', () => api.setAdminUserXp(userId, Number(xp)))} className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-slate-950 disabled:opacity-30"><Save className="h-4 w-4" /></button></div></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setConfirmation({ title: user.is_active ? 'ยืนยันการปิดบัญชี' : 'ยืนยันการเปิดบัญชี', description: user.is_active ? 'ผู้ใช้จะถูกนำออกจากระบบทุกอุปกรณ์และไม่สามารถ Login ได้' : 'ผู้ใช้จะสามารถ Login กลับเข้าสู่ระบบได้', label: user.is_active ? 'ปิดบัญชี' : 'เปิดบัญชี', destructive: Boolean(user.is_active), action: () => perform(user.is_active ? 'ปิดบัญชีสำเร็จ' : 'เปิดบัญชีสำเร็จ', () => api.setAdminUserStatus(userId, !Boolean(user.is_active))) })} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${user.is_active ? 'border-red-300/20 text-red-300 hover:bg-red-400/10' : 'border-emerald-300/20 text-emerald-300 hover:bg-emerald-400/10'}`}>{user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}{user.is_active ? 'ปิดบัญชี' : 'เปิดบัญชี'}</button>
            <button type="button" onClick={async () => { try { const result = await api.createPasswordReset(userId); setResetUrl(`${window.location.origin}${result.resetUrl}`); setNotice('สร้างลิงก์ Reset Password แบบใช้ครั้งเดียวแล้ว'); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'สร้างลิงก์ไม่สำเร็จ'); } }} className="flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 px-3 py-3 text-xs font-bold text-cyan-300 hover:bg-cyan-400/10"><KeyRound className="h-4 w-4" />Reset Password</button>
            <button type="button" onClick={() => setConfirmation({ title: 'Reset Progress ทั้งหมด?', description: 'ภารกิจ คำตอบ คำใบ้ เหรียญ แบบประเมิน เวลาเรียน XP Level Coins และ Streak จะถูกรีเซ็ต การดำเนินการนี้ย้อนกลับไม่ได้', label: 'Reset Progress', destructive: true, action: () => perform('Reset Progress สำเร็จ', () => api.resetAdminUserProgress(userId)) })} className="flex items-center justify-center gap-2 rounded-xl border border-red-300/20 px-3 py-3 text-xs font-bold text-red-300 hover:bg-red-400/10"><RotateCcw className="h-4 w-4" />Reset Progress</button>
          </div>
          {resetUrl && <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.06] p-4"><p className="text-xs font-bold text-cyan-300">One-time Reset Link · หมดอายุใน 30 นาที</p><div className="mt-2 flex gap-2"><input readOnly value={resetUrl} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 font-mono text-[10px] text-slate-300" /><button type="button" onClick={() => void navigator.clipboard.writeText(resetUrl)} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-slate-950"><Copy className="h-4 w-4" /></button></div><p className="mt-2 text-[11px] text-slate-500">ระบบไม่แสดงหรือสร้าง Password ให้ผู้ดูแล ผู้ใช้ต้องกำหนด Password ใหม่ผ่านลิงก์นี้ด้วยตนเอง</p></div>}
        </article>

        <article className={panel}><h3 className="text-lg font-black text-white">ผลการประเมิน</h3><div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1"><div className="rounded-2xl bg-cyan-400/[0.06] p-4"><p className="text-xs text-slate-500">Pre-Test</p><p className="mt-2 font-mono text-2xl font-black text-cyan-300">{score(data.assessment.preTest)}</p></div><div className="rounded-2xl bg-violet-400/[0.06] p-4"><p className="text-xs text-slate-500">Post-Test</p><p className="mt-2 font-mono text-2xl font-black text-violet-300">{score(data.assessment.postTest)}</p></div><div className="rounded-2xl bg-emerald-400/[0.06] p-4"><p className="text-xs text-slate-500">Improvement</p><p className="mt-2 font-mono text-2xl font-black text-emerald-300">{data.assessment.improvement === null ? '—' : `${data.assessment.improvement > 0 ? '+' : ''}${data.assessment.improvement}%`}</p></div></div></article>
      </section>

      <section className={panel}><h3 className="text-lg font-black text-white">ความคืบหน้าตามหมวด</h3><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.categoryProgress.map((category) => { const value = category.total ? Math.round(category.completed / category.total * 100) : 0; return <div key={category.category} className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4"><div className="flex justify-between gap-3"><span className="text-sm font-bold text-slate-300">{category.category}</span><span className="font-mono text-xs text-cyan-300">{category.completed}/{category.total}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" style={{ width: `${value}%` }} /></div></div>; })}</div></section>

      <section className="grid gap-6 2xl:grid-cols-2">
        <article className={`${panel} overflow-hidden p-0 sm:p-0`}><div className="flex items-center gap-2 border-b border-slate-700/60 p-5"><BookOpenCheck className="h-5 w-5 text-cyan-300" /><h3 className="font-black text-white">Mission History</h3></div><div className="max-h-[420px] overflow-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="sticky top-0 bg-slate-950 text-slate-500"><tr><th className="px-5 py-3">Mission</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Score</th><th className="px-5 py-3">Completed</th></tr></thead><tbody className="divide-y divide-slate-800">{data.missionHistory.map((mission) => <tr key={mission.missionId}><td className="max-w-xs truncate px-5 py-3 font-bold text-slate-300">{mission.title}</td><td className="px-3 py-3 font-mono text-cyan-300">{mission.status}</td><td className="px-3 py-3 font-mono text-amber-300">{mission.score}%</td><td className="px-5 py-3 whitespace-nowrap text-slate-500">{dateTime(mission.completedAt)}</td></tr>)}</tbody></table></div></article>
        <article className={`${panel} overflow-hidden p-0 sm:p-0`}><div className="flex items-center gap-2 border-b border-slate-700/60 p-5"><Flag className="h-5 w-5 text-rose-300" /><h3 className="font-black text-white">Flag History</h3></div><div className="max-h-[420px] overflow-auto">{data.flagHistory.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">ยังไม่เคยยึดธง</p> : data.flagHistory.map((flag) => <div key={flag.missionId} className="flex items-center justify-between gap-4 border-b border-slate-800 p-4"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-300">{flag.title}</p><p className="mt-1 text-xs text-slate-500">{dateTime(flag.capturedAt)}</p></div><span className="font-mono text-xs font-bold text-amber-300">+{flag.xpEarned} XP</span></div>)}</div></article>
        <article className={`${panel} overflow-hidden p-0 sm:p-0`}><div className="flex items-center gap-2 border-b border-slate-700/60 p-5"><Lightbulb className="h-5 w-5 text-amber-300" /><h3 className="font-black text-white">Hint Usage</h3></div><div className="max-h-[360px] overflow-auto">{data.hintUsage.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">ยังไม่เคยใช้คำใบ้</p> : data.hintUsage.map((hint) => <div key={hint.hintId} className="flex justify-between gap-4 border-b border-slate-800 p-4"><div><p className="text-sm font-bold text-slate-300">{hint.mission}</p><p className="mt-1 text-xs text-slate-500">คำใบ้ลำดับ {hint.hintOrder} · {dateTime(hint.usedAt)}</p></div><span className="font-mono text-xs text-red-300">-{hint.xpPenalty} XP</span></div>)}</div></article>
        <article className={`${panel} overflow-hidden p-0 sm:p-0`}><div className="flex items-center gap-2 border-b border-slate-700/60 p-5"><Activity className="h-5 w-5 text-emerald-300" /><h3 className="font-black text-white">Recent Activity</h3></div><div className="max-h-[360px] overflow-auto">{data.recentActivity.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">ยังไม่มีกิจกรรม</p> : data.recentActivity.map((activity) => <div key={activity.id} className="flex items-center justify-between gap-4 border-b border-slate-800 p-4"><div><p className="font-mono text-xs font-bold text-emerald-300">{activity.eventType}</p><p className="mt-1 text-[11px] text-slate-600">{activity.entityType || 'system'}{activity.entityId ? ` #${activity.entityId}` : ''}</p></div><span className="whitespace-nowrap text-[10px] text-slate-500">{dateTime(activity.createdAt)}</span></div>)}</div></article>
      </section>

      <AdminConfirmationModal open={Boolean(confirmation)} title={confirmation?.title || ''} description={confirmation?.description || ''} confirmLabel={confirmation?.label || 'ยืนยัน'} destructive={confirmation?.destructive} onClose={() => setConfirmation(null)} onConfirm={confirmation?.action || (async () => undefined)} />
    </div>
  );
};
