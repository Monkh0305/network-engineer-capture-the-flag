import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileArchive, FileUp, HardDrive, RefreshCw, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { AdminConfirmationModal } from '../../components/admin/AdminConfirmationModal';
import { api } from '../../services/api';
import type { AdminPacketTracerLab, AdminPacketTracerLabsResponse } from '../../types';

function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'ไม่มีข้อมูล';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'ไฟล์เดิมของระบบ';
}

export const AdminPacketTracerPage: React.FC = () => {
  const [data, setData] = useState<AdminPacketTracerLabsResponse | null>(null);
  const [missionId, setMissionId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [removeTarget, setRemoveTarget] = useState<AdminPacketTracerLab | null>(null);

  const load = async () => {
    setLoading(true);
    try { setData(await api.getAdminPacketTracerLabs()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'โหลดข้อมูลแล็บไม่สำเร็จ'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const selectedMission = useMemo(() => data?.labs.find((lab) => lab.missionId === Number(missionId)), [data, missionId]);

  const validateFile = (file: File): string | null => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    if (!data?.allowedExtensions.includes(extension)) return 'รองรับเฉพาะไฟล์ .pkt และ .pka';
    if (file.size > (data?.maxFileSize || 0)) return `ไฟล์ต้องมีขนาดไม่เกิน ${formatBytes(data?.maxFileSize || 0)}`;
    return null;
  };

  const uploadFile = async (targetMissionId: number, file: File) => {
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }
    setUploading(true); setError(''); setNotice('');
    try {
      const result = await api.uploadAdminPacketTracerLab(targetMissionId, file);
      setNotice(result.replaced ? 'แทนที่ไฟล์ Packet Tracer เรียบร้อยแล้ว' : 'อัปโหลดไฟล์ Packet Tracer เรียบร้อยแล้ว');
      setSelectedFile(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'อัปโหลดไฟล์ไม่สำเร็จ');
    } finally { setUploading(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!missionId || !selectedFile) { setError('กรุณาเลือกภารกิจและไฟล์ Packet Tracer'); return; }
    await uploadFile(Number(missionId), selectedFile);
  };

  const download = (lab: AdminPacketTracerLab) => {
    window.location.href = lab.isManaged
      ? api.getAdminPacketTracerDownloadUrl(lab.missionId)
      : api.getLabDownloadUrl(lab.filename || '', lab.missionId);
  };

  return <div className="space-y-5 pb-8">
    <section className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-slate-800/95 via-slate-900 to-slate-950 p-6 shadow-2xl sm:p-8">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><p className="font-mono text-[10px] font-bold tracking-[.2em] text-cyan-300">PACKET TRACER LAB MANAGEMENT</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">จัดการไฟล์แล็บ Packet Tracer</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">อัปโหลดและเชื่อมไฟล์ `.pkt` หรือ `.pka` กับภารกิจ โดยไฟล์จะพร้อมให้ผู้เรียนดาวน์โหลดไปเปิดใน Cisco Packet Tracer</p></div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/[.06] px-4 py-3 text-xs text-emerald-300"><ShieldCheck className="h-5 w-5" /><span>ไฟล์ถูกตรวจสอบและตั้งชื่อภายในอย่างปลอดภัย</span></div>
      </div>
    </section>

    {(error || notice) && <div role="status" className={`rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-300/20 bg-red-400/10 text-red-300' : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300'}`}>{error || notice}</div>}

    <form onSubmit={(event) => void submit(event)} className="grid gap-5 rounded-3xl border border-slate-700/60 bg-slate-900/65 p-5 shadow-xl lg:grid-cols-[1fr_1fr_auto] lg:items-end">
      <label className="space-y-2"><span className="text-xs font-bold text-slate-300">ภารกิจที่ต้องการเชื่อมไฟล์</span><select value={missionId} onChange={(event) => setMissionId(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-cyan-400"><option value="">เลือกภารกิจ</option>{data?.labs.map((lab) => <option key={lab.missionId} value={lab.missionId}>#{String(lab.missionNumber).padStart(2, '0')} — {lab.missionTitle}</option>)}</select></label>
      <label className="space-y-2"><span className="text-xs font-bold text-slate-300">ไฟล์ Packet Tracer</span><span className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cyan-300/30 bg-cyan-400/[.04] px-4 text-sm text-slate-400 hover:border-cyan-300/60"><FileUp className="h-4 w-4 text-cyan-300" /><span className="truncate">{selectedFile?.name || 'เลือกไฟล์ .pkt หรือ .pka'}</span><input type="file" accept=".pkt,.pka" className="sr-only" onChange={(event) => { setSelectedFile(event.target.files?.[0] || null); setError(''); }} /></span></label>
      <button disabled={uploading || !missionId || !selectedFile} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 text-sm font-black text-slate-950 shadow-[0_10px_30px_rgba(34,211,238,.18)] disabled:cursor-not-allowed disabled:opacity-40"><UploadCloud className="h-4 w-4" />{uploading ? 'กำลังอัปโหลด...' : selectedMission?.isManaged ? 'แทนที่ไฟล์' : 'อัปโหลดไฟล์'}</button>
      <p className="text-[11px] text-slate-500 lg:col-span-3">ขนาดสูงสุด {formatBytes(data?.maxFileSize || 0)} · ระบบจะไม่เปิด Packet Tracer ภายในเบราว์เซอร์</p>
    </form>

    <section className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/65 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4"><div><h2 className="font-black">ไฟล์ของแต่ละภารกิจ</h2><p className="mt-1 text-xs text-slate-500">ไฟล์เดิมยังใช้งานได้จนกว่าจะมีการอัปโหลดไฟล์จริงมาแทนที่</p></div><button onClick={() => void load()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 text-slate-400 hover:text-cyan-300" aria-label="โหลดข้อมูลใหม่"><RefreshCw className="h-4 w-4" /></button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">ภารกิจ</th><th className="px-4 py-4">ชื่อไฟล์</th><th className="px-4 py-4">ขนาด</th><th className="px-4 py-4">วันที่อัปโหลด</th><th className="px-4 py-4">ประเภท</th><th className="px-5 py-4 text-right">การจัดการ</th></tr></thead>
      <tbody className="divide-y divide-slate-800">{loading && <tr><td colSpan={6} className="py-14 text-center text-slate-500">กำลังโหลด...</td></tr>}{!loading && data?.labs.map((lab) => <tr key={lab.missionId} className="hover:bg-cyan-400/[.025]"><td className="px-5 py-4"><p className="text-sm font-bold text-slate-200">#{String(lab.missionNumber).padStart(2, '0')} {lab.missionTitle}</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${lab.missionStatus === 'published' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>{lab.missionStatus}</span></td><td className="px-4 py-4"><div className="flex items-center gap-2"><FileArchive className={`h-4 w-4 ${lab.filename ? 'text-cyan-300' : 'text-slate-600'}`} /><span className="max-w-[260px] truncate font-mono text-xs text-slate-300">{lab.filename || 'ยังไม่มีไฟล์'}</span></div></td><td className="px-4 py-4 font-mono text-xs text-slate-400">{formatBytes(lab.fileSize)}</td><td className="px-4 py-4 text-xs text-slate-400">{lab.filename ? formatDate(lab.uploadedAt) : '—'}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${lab.isManaged ? 'bg-cyan-400/10 text-cyan-300' : lab.filename ? 'bg-amber-400/10 text-amber-300' : 'bg-slate-700 text-slate-500'}`}>{lab.isManaged ? 'ไฟล์ที่อัปโหลด' : lab.filename ? 'ไฟล์เดิม' : 'ไม่มีไฟล์'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{lab.filename && <button onClick={() => download(lab)} title="ดาวน์โหลด" className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/20 text-cyan-300 hover:bg-cyan-400/10"><Download className="h-4 w-4" /></button>}<label title={lab.isManaged ? 'แทนที่ไฟล์' : 'อัปโหลดไฟล์'} className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-violet-300/20 text-violet-300 hover:bg-violet-400/10"><HardDrive className="h-4 w-4" /><input type="file" accept=".pkt,.pka" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(lab.missionId, file); event.currentTarget.value = ''; }} /></label>{lab.isManaged && <button onClick={() => setRemoveTarget(lab)} title="นำไฟล์ออก" className="grid h-9 w-9 place-items-center rounded-xl border border-red-300/20 text-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></button>}</div></td></tr>)}</tbody></table></div>
    </section>

    <AdminConfirmationModal open={Boolean(removeTarget)} title="นำไฟล์แล็บออก?" description={`ไฟล์ ${removeTarget?.filename || ''} จะถูกลบออกจากเซิร์ฟเวอร์ และผู้เรียนจะดาวน์โหลดไฟล์นี้ไม่ได้`} confirmLabel="นำไฟล์ออก" destructive onClose={() => setRemoveTarget(null)} onConfirm={async () => { if (!removeTarget) return; setError(''); try { await api.removeAdminPacketTracerLab(removeTarget.missionId); setNotice('นำไฟล์ออกเรียบร้อยแล้ว'); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'นำไฟล์ออกไม่สำเร็จ'); throw cause; } }} />
  </div>;
};
