import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Lock, Network } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!token) return setError('ลิงก์ Reset Password ไม่ถูกต้อง');
    if (password.length < 8) return setError('Password ต้องมีอย่างน้อย 8 ตัวอักษร');
    if (password !== confirmPassword) return setError('Password ทั้งสองช่องไม่ตรงกัน');
    setWorking(true);
    try { await api.resetPassword(token, password); setComplete(true); }
    catch (resetError) { setError(resetError instanceof Error ? resetError.message : 'เปลี่ยน Password ไม่สำเร็จ'); }
    finally { setWorking(false); }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#080D18] p-4 text-white">
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(#67e8f9_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <section className="relative w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300"><Network className="h-6 w-6" /></div><div><p className="font-black">Network CTF</p><p className="font-mono text-[9px] tracking-[0.2em] text-slate-500">SECURE PASSWORD RESET</p></div></div>
        {complete ? <div className="py-10 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-300" /><h1 className="mt-5 text-2xl font-black">เปลี่ยน Password สำเร็จ</h1><p className="mt-2 text-sm text-slate-400">Session เดิมถูกยกเลิกแล้ว กรุณา Login ด้วย Password ใหม่</p><button type="button" onClick={() => navigate('/login')} className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950">ไปหน้า Login</button></div> : <><div className="mt-8"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-300"><KeyRound className="h-5 w-5" /></div><h1 className="mt-5 text-2xl font-black">กำหนด Password ใหม่</h1><p className="mt-2 text-sm text-slate-400">ลิงก์นี้ใช้ได้ครั้งเดียวและมีอายุ 30 นาที</p></div><form onSubmit={submit} className="mt-7 space-y-4"><label className="block"><span className="text-xs font-bold text-slate-400">Password ใหม่</span><div className="relative mt-2"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 text-sm outline-none focus:border-cyan-400" /></div></label><label className="block"><span className="text-xs font-bold text-slate-400">ยืนยัน Password ใหม่</span><div className="relative mt-2"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 text-sm outline-none focus:border-cyan-400" /></div></label>{error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">{error}</p>}<button type="submit" disabled={working} className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-black text-slate-950 disabled:opacity-50">{working ? 'กำลังบันทึก...' : 'บันทึก Password ใหม่'}</button></form></>}
      </section>
    </div>
  );
};
