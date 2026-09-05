import React from 'react';
import { ChevronLeft, ChevronRight, LogOut, MonitorUp, Network, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { adminGroupLabels, adminNavItems, type AdminNavGroup } from './adminNavigation';

interface AdminSidebarProps {
  pathname: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onNavigate: (path: string) => void;
  onSwitchToUser: () => void;
  onLogout: () => void;
}

const groups: AdminNavGroup[] = ['overview', 'management', 'research', 'system'];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pathname, collapsed, mobileOpen, onToggleCollapsed, onCloseMobile,
  onNavigate, onSwitchToUser, onLogout,
}) => {
  const { language } = useLanguage();

  const isActive = (path: string) => path === '/admin' ? pathname === path : pathname.startsWith(path);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-visible border-r border-slate-700/60 bg-[#0B1220]/95 text-white shadow-2xl backdrop-blur-xl transition-[width,transform] duration-[250ms] ease-out lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'lg:w-[84px]' : 'lg:w-[264px]'}`}
      aria-label={language === 'th' ? 'เมนูผู้ดูแลระบบ' : 'Admin navigation'}
    >
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-700/60 px-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300 shadow-[0_0_26px_rgba(34,211,238,0.1)]">
          <Network className="h-7 w-7" />
        </div>
        <div className={`min-w-0 flex-1 transition-[opacity,transform] duration-[220ms] ${collapsed ? 'lg:pointer-events-none lg:-translate-x-2 lg:opacity-0' : ''}`}>
          <div className="whitespace-nowrap text-base font-black tracking-tight">Network <span className="text-cyan-300">CTF</span></div>
          <div className="mt-1 whitespace-nowrap font-mono text-[10px] font-bold tracking-[0.18em] text-violet-300">ADMIN PANEL</div>
        </div>
        <button type="button" onClick={onCloseMobile} className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label={language === 'th' ? 'ปิดเมนู' : 'Close menu'}>
          <X className="h-5 w-5" />
        </button>
        <button type="button" onClick={onToggleCollapsed} className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 transition-colors hover:border-cyan-300/40 hover:text-cyan-300 lg:flex ${collapsed ? 'absolute right-[-18px] top-[22px] z-10 bg-[#111827]' : ''}`} aria-label={collapsed ? (language === 'th' ? 'ขยาย Sidebar' : 'Expand sidebar') : (language === 'th' ? 'ย่อ Sidebar' : 'Collapse sidebar')}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="admin-sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {groups.map((group) => {
          const items = adminNavItems.filter((item) => item.group === group);
          return (
            <div key={group} className={group === 'overview' ? '' : 'mt-5 border-t border-slate-800 pt-4'}>
              {group !== 'overview' && (
                <div className={`mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-opacity ${collapsed ? 'lg:opacity-0' : ''}`}>
                  {adminGroupLabels[group as Exclude<AdminNavGroup, 'overview'>][language]}
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => onNavigate(item.path)}
                      className={`group relative flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all ${active ? 'bg-gradient-to-r from-cyan-400/15 to-violet-500/10 text-cyan-200 ring-1 ring-inset ring-cyan-300/20 shadow-[0_0_22px_rgba(34,211,238,0.06)]' : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'}`}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label[language] : undefined}
                    >
                      {active && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-gradient-to-b from-cyan-300 to-violet-400" />}
                      <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-violet-300'}`} />
                      <span className={`min-w-0 truncate transition-[opacity,transform] duration-[220ms] ${collapsed ? 'lg:pointer-events-none lg:-translate-x-2 lg:opacity-0' : ''}`}>{item.label[language]}</span>
                      {collapsed && <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 hidden whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 lg:block">{item.label[language]}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-slate-700/60 p-3">
        <button type="button" onClick={onSwitchToUser} className="group relative flex h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/10">
          <MonitorUp className="h-5 w-5 shrink-0" />
          <span className={`whitespace-nowrap transition-[opacity,transform] duration-[220ms] ${collapsed ? 'lg:pointer-events-none lg:-translate-x-2 lg:opacity-0' : ''}`}>{language === 'th' ? 'สลับไปมุมมองผู้เรียน' : 'Switch to User View'}</span>
          {collapsed && <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 hidden whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl group-hover:opacity-100 lg:block">{language === 'th' ? 'สลับไปมุมมองผู้เรียน' : 'Switch to User View'}</span>}
        </button>
        <button type="button" onClick={onLogout} className="group relative flex h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300">
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={`transition-[opacity,transform] duration-[220ms] ${collapsed ? 'lg:pointer-events-none lg:-translate-x-2 lg:opacity-0' : ''}`}>{language === 'th' ? 'ออกจากระบบ' : 'Logout'}</span>
          {collapsed && <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 hidden whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl group-hover:opacity-100 lg:block">{language === 'th' ? 'ออกจากระบบ' : 'Logout'}</span>}
        </button>
      </div>
    </aside>
  );
};
