import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Eye, Search, Shield, UserCheck, UserX, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminConfirmationModal } from '../../components/admin/AdminConfirmationModal';
import { api } from '../../services/api';
import type { AdminUserListItem, AdminUsersResponse } from '../../types';

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours} ชม. ${minutes} นาที` : `${minutes} นาที`;
};

type SortOrder = 'asc' | 'desc';

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('username');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusTarget, setStatusTarget] = useState<AdminUserListItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.getAdminUsers({ page, pageSize, search, role, status, sortBy, sortOrder }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadUsers(); }, [page, pageSize, search, role, status, sortBy, sortOrder]);

  const sort = (column: string) => {
    if (sortBy === column) setSortOrder((current) => current === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
    setPage(1);
  };
  const SortIcon = sortOrder === 'asc' ? ArrowUp : ArrowDown;
  const header = (label: string, column: string) => (
    <button type="button" onClick={() => sort(column)} className="inline-flex items-center gap-1.5 whitespace-nowrap font-bold hover:text-cyan-300">{label}{sortBy === column && <SortIcon className="h-3.5 w-3.5" />}</button>
  );

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-slate-800/90 to-slate-950 p-6 shadow-2xl sm:p-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex items-end justify-between gap-6"><div><p className="font-mono text-[10px] font-bold tracking-[0.2em] text-cyan-300">USER MANAGEMENT</p><h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">จัดการผู้ใช้งาน</h2><p className="mt-2 text-sm text-slate-400">ค้นหา ตรวจสอบสิทธิ์ และติดตามความคืบหน้าของผู้เรียน</p></div><div className="hidden rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.06] p-4 text-cyan-300 sm:block"><Users className="h-7 w-7" /></div></div>
      </section>

      <section className="rounded-3xl border border-slate-700/60 bg-slate-900/65 p-4 shadow-xl sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_180px_180px_auto]">
          <label className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="ค้นหา Username หรือ Email" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-400" /></label>
          <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-300 outline-none focus:border-cyan-400"><option value="all">ทุก Role</option><option value="user">USER</option><option value="admin">ADMIN</option></select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-300 outline-none focus:border-cyan-400"><option value="all">ทุกสถานะ</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-300"><option value={10}>10 / หน้า</option><option value={20}>20 / หน้า</option><option value={50}>50 / หน้า</option></select>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/65 shadow-2xl">
        {error && <div className="border-b border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left">
            <thead className="border-b border-slate-700/70 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-500"><tr>
              <th className="px-5 py-4">{header('Username', 'username')}</th><th className="px-4 py-4">{header('Email', 'email')}</th><th className="px-4 py-4">{header('Role', 'role')}</th><th className="px-4 py-4">{header('Level', 'level')}</th><th className="px-4 py-4">{header('XP', 'xp')}</th><th className="px-4 py-4">{header('Completed Missions', 'completedMissions')}</th><th className="px-4 py-4">{header('Learning Time', 'learningTime')}</th><th className="px-4 py-4">{header('Last Active', 'lastActive')}</th><th className="px-4 py-4">{header('Status', 'status')}</th><th className="px-5 py-4 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {loading && <tr><td colSpan={10} className="px-5 py-14 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</td></tr>}
              {!loading && data?.users.length === 0 && <tr><td colSpan={10} className="px-5 py-14 text-center text-sm text-slate-500">ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข</td></tr>}
              {!loading && data?.users.map((user) => (
                <tr key={user.id} className="transition hover:bg-cyan-400/[0.035]">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-xs font-black text-cyan-300">{user.username.slice(0, 2).toUpperCase()}</div><span className="font-bold text-slate-200">{user.username}</span></div></td>
                  <td className="px-4 py-4 text-sm text-slate-400">{user.email}</td>
                  <td className="px-4 py-4"><span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold ${user.role === 'admin' ? 'border-violet-300/20 bg-violet-400/10 text-violet-300' : 'border-slate-600 bg-slate-800 text-slate-300'}`}><Shield className="h-3 w-3" />{user.role.toUpperCase()}</span></td>
                  <td className="px-4 py-4 font-mono text-sm font-bold text-blue-300">{user.level}</td><td className="px-4 py-4 font-mono text-sm font-bold text-amber-300">{user.xp.toLocaleString()}</td><td className="px-4 py-4 text-center font-mono text-sm text-emerald-300">{user.completedMissions}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{formatDuration(user.learningTime)}</td><td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">{user.lastActive ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(user.lastActive)) : 'ยังไม่เคยใช้งาน'}</td>
                  <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${user.isActive ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>{user.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => navigate(`/admin/users/${user.id}`)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 text-slate-400 hover:border-cyan-300/30 hover:text-cyan-300" title="ดูรายละเอียด"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => setStatusTarget(user)} className={`grid h-9 w-9 place-items-center rounded-xl border ${user.isActive ? 'border-red-300/20 text-red-300 hover:bg-red-400/10' : 'border-emerald-300/20 text-emerald-300 hover:bg-emerald-400/10'}`} title={user.isActive ? 'ปิดบัญชี' : 'เปิดบัญชี'}>{user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-700/60 px-5 py-4 sm:flex-row"><p className="text-xs text-slate-500">ทั้งหมด {data.pagination.total.toLocaleString()} บัญชี · หน้า {data.pagination.page} จาก {data.pagination.totalPages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 text-slate-300 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={page >= data.pagination.totalPages} onClick={() => setPage((value) => value + 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 text-slate-300 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>}
      </section>

      <AdminConfirmationModal open={Boolean(statusTarget)} title={statusTarget?.isActive ? 'ยืนยันการปิดบัญชี' : 'ยืนยันการเปิดบัญชี'} description={statusTarget?.isActive ? `ผู้ใช้ ${statusTarget.username} จะออกจากระบบทุกอุปกรณ์และไม่สามารถ Login ได้` : `อนุญาตให้ ${statusTarget?.username} กลับมาเข้าใช้งานระบบ`} confirmLabel={statusTarget?.isActive ? 'ปิดบัญชี' : 'เปิดบัญชี'} destructive={Boolean(statusTarget?.isActive)} onClose={() => setStatusTarget(null)} onConfirm={async () => { if (!statusTarget) return; await api.setAdminUserStatus(statusTarget.id, !Boolean(statusTarget.isActive)); await loadUsers(); }} />
    </div>
  );
};
