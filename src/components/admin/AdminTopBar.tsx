import React from 'react';
import { ChevronRight, Languages, Menu, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import type { AdminNavItem } from './adminNavigation';

interface AdminTopBarProps {
  user: User;
  currentItem: AdminNavItem;
  onOpenMobile: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ user, currentItem, onOpenMobile }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-3 border-b border-slate-700/50 bg-[#0B1220]/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenMobile} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 hover:border-cyan-300/40 hover:text-cyan-300 lg:hidden" aria-label={language === 'th' ? 'เปิดเมนูผู้ดูแล' : 'Open admin menu'}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 sm:text-xs">
            <span>Admin</span><ChevronRight className="h-3.5 w-3.5" /><span className="truncate text-cyan-300">{currentItem.label[language]}</span>
          </div>
          <h1 className="mt-1 truncate text-lg font-black text-white sm:text-xl">{currentItem.label[language]}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button type="button" onClick={toggleLanguage} className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/75 px-3 text-xs font-bold text-slate-300 transition-colors hover:border-cyan-300/40 hover:text-white" aria-label={language === 'th' ? 'เปลี่ยนภาษา' : 'Switch language'}>
          <Languages className="h-4 w-4 text-emerald-300" />
          <span className={language === 'th' ? 'text-emerald-300' : ''}>TH</span>
          <span className="text-slate-600">/</span>
          <span className={language === 'en' ? 'text-emerald-300' : ''}>EN</span>
        </button>
        <div className="hidden h-11 items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] px-3 sm:flex">
          <ShieldCheck className="h-4 w-4 text-cyan-300" />
          <span className="font-mono text-[11px] font-bold text-cyan-200">ADMIN</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl py-1 pl-1 sm:pr-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-400 bg-slate-800 text-xs font-black text-white">{user.username.slice(0, 2).toUpperCase()}</div>
          <div className="hidden min-w-0 md:block">
            <div className="max-w-36 truncate text-sm font-bold text-white">{user.username}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
};
