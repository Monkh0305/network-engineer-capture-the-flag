import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AdminConfirmationModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const AdminConfirmationModal: React.FC<AdminConfirmationModalProps> = ({
  open, title, description, confirmLabel, destructive = false, onClose, onConfirm,
}) => {
  const [working, setWorking] = useState(false);
  if (!open) return null;

  const confirm = async () => {
    setWorking(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // The parent owns the user-facing error state and keeps the modal open.
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${destructive ? 'border-red-300/20 bg-red-400/10 text-red-300' : 'border-amber-300/20 bg-amber-400/10 text-amber-300'}`}><AlertTriangle className="h-5 w-5" /></div>
          <button type="button" onClick={onClose} disabled={working} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <h2 id="admin-confirm-title" className="mt-5 text-xl font-black text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={working} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5">ยกเลิก</button>
          <button type="button" onClick={() => void confirm()} disabled={working} className={`rounded-xl px-4 py-2.5 text-sm font-black text-white disabled:opacity-50 ${destructive ? 'bg-red-500 hover:bg-red-400' : 'bg-amber-500 hover:bg-amber-400'}`}>{working ? 'กำลังดำเนินการ...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};
