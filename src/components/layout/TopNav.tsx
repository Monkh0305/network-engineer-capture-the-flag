import React, { useState } from 'react';
import {
  Award, Bell, BookOpen, ChevronDown, ClipboardCheck, Crosshair, Flame,
  Languages, LayoutDashboard, LogOut, Menu, Moon, Search, Star, Sun,
  Terminal, Trophy, User as UserIcon, Users, X,
} from 'lucide-react';
import { User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

type Theme = 'light' | 'dark';

interface TopNavProps {
  user: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateProfile: () => void;
  onLogout?: () => void;
  mobileMenuOpen: boolean;
  theme: Theme;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  onToggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  user, currentTab, onSelectTab, searchQuery, onSearchChange, onNavigateProfile,
  onLogout, mobileMenuOpen, theme, onToggleMobileMenu, onCloseMobileMenu, onToggleTheme,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const displayUser = user || {
    id: 1, username: 'cadet_networker', email: 'student@capstone.edu', level: 2,
    total_xp: 1240, coins: 450, streak_days: 7, missions_completed: 3, flags_captured: 3,
  };

  const topNavItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'learning-path', label: t('nav.learning_path'), icon: BookOpen },
    { id: 'missions', label: t('nav.missions'), icon: Crosshair },
    { id: 'packet-tracer', label: t('nav.packet_tracer'), icon: Terminal },
    { id: 'leaderboard', label: t('nav.leaderboard'), icon: Trophy },
    { id: 'achievements', label: t('nav.achievements'), icon: Users },
    { id: 'assessment', label: language === 'th' ? 'แบบประเมิน' : 'Assessment', icon: ClipboardCheck },
  ];

  const goTo = (tab: string) => {
    onSelectTab(tab);
    onCloseMobileMenu();
    setShowNotifications(false);
    setShowProfileDropdown(false);
  };

  return (
    <>
      <header id="top-navbar" className="tech-navbar fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[#34383D] bg-[#17191C] px-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)] sm:px-5 lg:h-24 xl:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 xl:gap-5">
          <button
            type="button"
            onClick={() => { setShowNotifications(false); setShowProfileDropdown(false); onToggleMobileMenu(); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3B4046] bg-[#23272B] text-slate-200 transition-colors hover:border-[#22C55E]/60 hover:text-white lg:hidden"
            aria-label={mobileMenuOpen ? (language === 'th' ? 'ปิดเมนูหลัก' : 'Close main menu') : (language === 'th' ? 'เปิดเมนูหลัก' : 'Open main menu')}
            aria-expanded={mobileMenuOpen}
            aria-controls="top-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" />}
          </button>

          <button type="button" onClick={() => goTo('dashboard')} className="group flex shrink-0 items-center gap-2 text-left sm:gap-3" aria-label="Network CTF">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-cyan-400/10 ring-1 ring-cyan-300/25 lg:h-12 lg:w-12 lg:rounded-2xl">
              <svg viewBox="0 0 36 36" className="h-9 w-9 lg:h-10 lg:w-10" aria-hidden="true">
                <line x1="18" y1="8" x2="8" y2="24" stroke="#22D3EE" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="18" y1="8" x2="28" y2="24" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="8" y1="24" x2="28" y2="24" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="18" cy="8" r="4" fill="#17191C" stroke="#22D3EE" strokeWidth="2.5" />
                <circle cx="8" cy="24" r="3.6" fill="#17191C" stroke="#3B82F6" strokeWidth="2.5" />
                <circle cx="28" cy="24" r="3.6" fill="#17191C" stroke="#8B5CF6" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="hidden whitespace-nowrap sm:block">
              <div className="text-[15px] font-black leading-none tracking-tight text-white lg:text-base">Network <span className="text-cyan-300">CTF</span></div>
              <div className="mt-1.5 hidden text-[10px] font-mono uppercase tracking-[0.14em] text-[#9CA3AF] xl:block">
                {language === 'th' ? 'เรียนรู้ • ตั้งค่า • แก้ปัญหา' : 'LEARN • CONFIGURE • TROUBLESHOOT'}
              </div>
            </div>
          </button>

          <nav className="hidden min-w-0 items-center gap-1 lg:flex" aria-label={language === 'th' ? 'เมนูหลัก' : 'Main navigation'}>
            {topNavItems.filter((item) => item.id !== 'assessment').map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`topnav-tab-${item.id}`}
                  type="button"
                  onClick={() => goTo(item.id)}
                  className={`relative flex h-14 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[14px] px-3.5 text-[15px] font-semibold transition-colors ${isActive ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-300/15' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'}`}
                  title={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={`hidden ${item.id === 'assessment' ? 'min-[2150px]:inline' : 'min-[1800px]:inline'}`}>{item.label}</span>
                  {isActive && <span className="absolute inset-x-3.5 -bottom-5 h-[3px] rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_12px_rgba(34,211,238,0.45)]" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="relative z-10 ml-3 flex shrink-0 items-center gap-2 border-l border-white/10 bg-transparent pl-4 xl:ml-4 xl:gap-2.5 xl:pl-5">
          <div className="relative hidden min-[2200px]:block w-60">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder={t('nav.search_placeholder')} className="w-full rounded-full border border-[#3B4046] bg-[#23272B] py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-400 focus:border-[#22C55E] focus:outline-none" />
          </div>

          <div className="relative hidden shrink-0 sm:block">
            <button type="button" onClick={() => { setShowNotifications((open) => !open); setShowProfileDropdown(false); }} className={`relative flex h-11 w-11 items-center justify-center rounded-[14px] border bg-[#23272B] text-slate-300 transition-all hover:border-cyan-300/50 hover:text-cyan-200 ${showNotifications ? 'border-cyan-300/55 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.12)]' : 'border-[#3B4046]'}`} title={language === 'th' ? 'การแจ้งเตือน' : 'Notifications'} aria-label={language === 'th' ? 'เปิดการแจ้งเตือน' : 'Open notifications'} aria-expanded={showNotifications}>
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#23272B] bg-[#F97316] px-0.5 text-[9px] font-black leading-none text-white">3</span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-[4.5rem] w-80 rounded-2xl border border-[#34383D] bg-[#1C1F23] p-4 text-sm text-slate-300 shadow-2xl">
                <div className="flex justify-between border-b border-[#34383D] pb-2 font-bold text-white">
                  <span>{language === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</span><span className="font-mono text-[10px] text-[#4ADE80]">3 {language === 'th' ? 'รายการใหม่' : 'new'}</span>
                </div>
                <div className="space-y-3 pt-3">
                  <p><strong className="text-white">Mission 05</strong> {language === 'th' ? 'พร้อมให้ตรวจสอบแล้ว' : 'is ready for investigation.'}</p>
                  <p><strong className="text-[#4ADE80]">+150 XP</strong> {language === 'th' ? 'จากภารกิจ VLAN' : 'awarded for the VLAN challenge.'}</p>
                  <p><strong className="text-[#FB923C]">Weekly Challenge</strong> {language === 'th' ? 'สำเร็จแล้ว 1 จาก 3 ภารกิจ' : 'is 1 of 3 complete.'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-11 items-center gap-2 rounded-full border border-[#3B4046] bg-[#23272B] px-3.5 text-sm font-bold text-white min-[2100px]:flex">
            <Flame className="h-5 w-5 fill-[#F97316] text-[#F97316]" /><span>{displayUser.streak_days || 7}</span>
          </div>
          <div className="xp-nav-pill hidden h-11 items-center gap-2 rounded-full border border-[#3B4046] bg-[#23272B] px-3.5 text-sm font-bold text-white xl:flex">
            <Star className="h-[18px] w-[18px] fill-[#F97316] text-[#F97316]" /><span className="font-mono">{displayUser.total_xp?.toLocaleString() || '1,240'} XP</span>
          </div>

          <button type="button" onClick={onToggleTheme} className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#3B4046] bg-[#23272B] text-slate-200 transition-colors hover:border-[#F97316]/60 hover:text-[#FB923C]" title={theme === 'dark' ? (language === 'th' ? 'เปลี่ยนเป็นธีมสว่าง' : 'Use light theme') : (language === 'th' ? 'เปลี่ยนเป็นธีมมืด' : 'Use dark theme')} aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button type="button" onClick={toggleLanguage} className="flex h-11 items-center gap-1.5 rounded-[14px] border border-[#3B4046] bg-[#23272B] px-3 text-xs font-bold text-slate-300 transition-colors hover:text-white" title={language === 'th' ? 'เปลี่ยนภาษา' : 'Switch language'}>
            <Languages className="hidden h-[18px] w-[18px] text-[#22C55E] sm:block" />
            <span className={language === 'th' ? 'text-[#4ADE80]' : ''}>TH</span><span className="text-slate-600">/</span><span className={language === 'en' ? 'text-[#4ADE80]' : ''}>EN</span>
          </button>

          <div className="relative">
            <button type="button" onClick={() => { setShowProfileDropdown((open) => !open); setShowNotifications(false); }} className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-white/[0.06]" aria-label={language === 'th' ? 'เมนูผู้ใช้' : 'User menu'}>
              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#22C55E] bg-[#34383D] text-sm font-bold text-white">
                <span>{displayUser.username.slice(0, 2).toUpperCase()}</span>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#17191C] bg-[#22C55E]" />
              </div>
              <div className="hidden text-left xl:block">
                <div className="flex items-center gap-1 text-sm font-bold text-white">{displayUser.username}<ChevronDown className="h-4 w-4 text-slate-400" /></div>
                <div className="mt-0.5 text-[11px] font-semibold text-[#4ADE80]">{language === 'th' ? 'ระดับ' : 'Level'} {displayUser.level || 2}</div>
              </div>
            </button>
            {showProfileDropdown && (
              <div className="fixed left-3 right-3 top-[5.5rem] rounded-2xl border border-[#34383D] bg-[#1C1F23] p-2 text-sm shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-[4.5rem] sm:w-64">
                <button type="button" onClick={() => { onNavigateProfile(); setShowProfileDropdown(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-slate-300 hover:bg-white/[0.06] hover:text-white"><UserIcon className="h-4 w-4 text-[#4ADE80]" />{language === 'th' ? 'ข้อมูลผู้ใช้' : 'View Profile'}</button>
                <button type="button" onClick={() => goTo('assessment')} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-slate-300 hover:bg-white/[0.06] hover:text-white"><Award className="h-4 w-4 text-[#FB923C]" />{language === 'th' ? 'แบบประเมินก่อนและหลังเรียน' : 'Pre/Post Assessment'}</button>
                {onLogout && <button type="button" onClick={() => { onLogout(); setShowProfileDropdown(false); }} className="mt-1 flex w-full items-center gap-2 border-t border-[#34383D] px-3 py-2.5 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300"><LogOut className="h-4 w-4" />{t('nav.logout')}</button>}
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <button type="button" className="fixed inset-0 top-20 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden" onClick={onCloseMobileMenu} aria-label={language === 'th' ? 'ปิดเมนู' : 'Close menu'} />
          <nav id="top-mobile-menu" className="fixed left-3 right-3 top-[5.5rem] z-50 max-h-[calc(100dvh-6.5rem)] overflow-y-auto rounded-2xl border border-[#3B4046] bg-[#1C1F23] p-3 shadow-2xl lg:hidden" aria-label={language === 'th' ? 'เมนูหลัก' : 'Main navigation'}>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder={t('nav.search_placeholder')} className="w-full rounded-xl border border-[#3B4046] bg-[#24282D] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-[#22C55E] focus:outline-none" />
            </div>
            <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
              {topNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => goTo(item.id)} className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 text-left text-[15px] font-semibold transition-colors ${isActive ? 'border-cyan-300/40 bg-gradient-to-r from-cyan-400/15 to-violet-500/10 text-cyan-300' : 'border-transparent bg-[#24282D] text-slate-200 hover:border-[#4A5057] hover:bg-[#2B3035]'}`}>
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-cyan-300' : 'text-violet-400'}`} /><span className="min-w-0 break-words">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#34383D] pt-3">
              <button type="button" onClick={() => { onNavigateProfile(); onCloseMobileMenu(); }} className="flex items-center gap-2 text-sm font-semibold text-slate-200"><UserIcon className="h-4 w-4 text-[#4ADE80]" />{language === 'th' ? 'ข้อมูลผู้ใช้' : 'Profile'}</button>
              {onLogout && <button type="button" onClick={onLogout} className="flex items-center gap-2 text-sm font-semibold text-red-400"><LogOut className="h-4 w-4" />{t('nav.logout')}</button>}
            </div>
          </nav>
        </>
      )}
    </>
  );
};
