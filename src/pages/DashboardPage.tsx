import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Flag, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Flame,
  Crown,
  ChevronRight,
  ShieldCheck,
  Server,
  Layers,
  Network,
  Wrench,
  Compass,
  AlertTriangle,
  Play,
  Lightbulb,
  Radio,
  Signal,
  Check
} from 'lucide-react';
import { User, Mission } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { WeeklyProgressChart } from '../components/ui/WeeklyProgressChart';
import { IsometricNetworkSwitch } from '../components/illustrations/IsometricNetworkSwitch';

interface DashboardPageProps {
  user: User;
  onSelectMission: (missionId: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onSelectMission,
  onNavigateTab,
}) => {
  const { language } = useLanguage();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getMissions();
      if (res && res.missions) {
        setMissions(res.missions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Find Mission 05 for hero card or fallback to mission 5
  const heroMission = missions.find(m => m.id === 5) || {
    id: 5,
    title: 'Mission 05 — Administratively Shutdown Switch Port',
    description: 'A critical network printer in Marketing suddenly disappeared from the network after night-time maintenance.',
    difficulty: 'Intermediate',
    estimated_time: '20 min',
    xp_reward: 150,
    category: 'Switching',
    order_index: 5,
    stage_name: 'Switching & Gateway',
    status: 'in_progress',
    completionPercentage: 50,
  };

  const domainCards = [
    { 
      name: language === 'th' ? 'พื้นฐานเน็ตเวิร์ก' : 'Network Fundamentals', 
      percent: 100, 
      color: 'bg-[#22C55E]', 
      textColor: 'text-[#22C55E]',
      icon: Network, 
      bgLight: 'bg-emerald-50 text-emerald-600 border-emerald-200' 
    },
    { 
      name: language === 'th' ? 'การจัดสรร IP' : 'IP Addressing', 
      percent: 100, 
      color: 'bg-purple-600', 
      textColor: 'text-purple-600',
      icon: Layers, 
      bgLight: 'bg-purple-50 text-purple-600 border-purple-200' 
    },
    { 
      name: language === 'th' ? 'สวิตชิ่ง' : 'Switching', 
      percent: 0, 
      color: 'bg-blue-600', 
      textColor: 'text-blue-600',
      icon: Server, 
      bgLight: 'bg-blue-50 text-blue-600 border-blue-200' 
    },
    { 
      name: 'VLAN', 
      percent: 0, 
      color: 'bg-pink-600', 
      textColor: 'text-pink-600',
      icon: Network, 
      bgLight: 'bg-pink-50 text-pink-600 border-pink-200' 
    },
    { 
      name: language === 'th' ? 'เราติ้ง' : 'Routing', 
      percent: 0, 
      color: 'bg-amber-500', 
      textColor: 'text-amber-600',
      icon: Compass, 
      bgLight: 'bg-amber-50 text-amber-600 border-amber-200' 
    },
    { 
      name: language === 'th' ? 'การแก้ปัญหา' : 'Troubleshooting', 
      percent: 0, 
      color: 'bg-red-500', 
      textColor: 'text-red-600',
      icon: Wrench, 
      bgLight: 'bg-red-50 text-red-600 border-red-200' 
    },
  ];

  const recommendedMissions = [
    {
      id: 6,
      missionNo: language === 'th' ? 'ภารกิจ 06' : 'Mission 06',
      title: language === 'th' ? 'เกตเวย์ตั้งค่าผิดพลาด' : 'Wrong Default Gateway',
      difficulty: language === 'th' ? 'ง่าย' : 'Easy',
      diffColor: 'bg-emerald-100 text-emerald-700',
      time: language === 'th' ? '15 นาที' : '15 min',
      desc: language === 'th' ? 'ผู้ใช้งานไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เนื่องจากการตั้งค่า Default Gateway ผิด' : 'Users cannot access the server due to an incorrect default gateway configuration.',
      xp: 100,
      deviceType: 'router'
    },
    {
      id: 7,
      missionNo: language === 'th' ? 'ภารกิจ 07' : 'Mission 07',
      title: language === 'th' ? 'การกำหนดเส้นทางคงที่' : 'Static Routing',
      difficulty: language === 'th' ? 'ปานกลาง' : 'Medium',
      diffColor: 'bg-blue-100 text-blue-700',
      time: language === 'th' ? '20 นาที' : '20 min',
      desc: language === 'th' ? 'กำหนด Static Route เพื่อให้สามารถสื่อสารข้ามเครือข่ายได้สำเร็จ' : 'Configure static routes to enable communication between networks.',
      xp: 150,
      deviceType: 'router_dual'
    },
    {
      id: 8,
      missionNo: language === 'th' ? 'ภารกิจ 08' : 'Mission 08',
      title: language === 'th' ? 'ระบบ DHCP ล้มเหลว' : 'DHCP Failure',
      difficulty: language === 'th' ? 'ปานกลาง' : 'Medium',
      diffColor: 'bg-blue-100 text-blue-700',
      time: language === 'th' ? '25 นาที' : '25 min',
      desc: language === 'th' ? 'แก้ไขปัญหาการแจกจ่าย IP จาก DHCP Server ให้เครื่องผู้ใช้' : 'Troubleshoot DHCP configuration and restore client connectivity.',
      xp: 150,
      deviceType: 'switch'
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 2-Column Main Dashboard Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* ================= LEFT / MAIN CONTENT (8 COLS) ================= */}
        <div className="xl:col-span-8 space-y-6">

          {/* 1. Welcome Banner Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            {/* Background subtle mesh glow */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-50/80 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-1 relative z-10">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {language === 'th' ? 'สวัสดี' : 'Hey'} {user?.username || 'cadet_networker'}!
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                {language === 'th' ? 'พร้อมที่จะพิชิตโจทย์เน็ตเวิร์กข้อถัดไปหรือยัง?' : 'Ready to solve the next network challenge?'}
              </p>
            </div>

            {/* Server Rack Illustration + Quote Box */}
            <div className="relative z-10 flex flex-col items-center gap-3 min-[420px]:flex-row min-[420px]:gap-4 md:shrink-0">
              {/* Isometric Server Graphic */}
              <div className="w-20 h-20 md:w-24 md:h-24 relative flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                  {/* Isometric Server Cabinet */}
                  <polygon points="50,15 85,32 50,48 15,32" fill="#93C5FD" />
                  <polygon points="15,32 50,48 50,85 15,69" fill="#1E40AF" />
                  <polygon points="85,32 50,48 50,85 85,69" fill="#3B82F6" />
                  
                  {/* Server Units Lines and Blinking LEDs */}
                  <line x1="22" y1="42" x2="43" y2="52" stroke="#60A5FA" strokeWidth="1.5" />
                  <line x1="22" y1="52" x2="43" y2="62" stroke="#60A5FA" strokeWidth="1.5" />
                  <line x1="22" y1="62" x2="43" y2="72" stroke="#60A5FA" strokeWidth="1.5" />
                  
                  {/* Status LEDs */}
                  <circle cx="25" cy="40" r="1.5" fill="#4ADE80" />
                  <circle cx="28" cy="41" r="1.5" fill="#4ADE80" />
                  <circle cx="25" cy="50" r="1.5" fill="#4ADE80" />
                  <circle cx="28" cy="51" r="1.5" fill="#F87171" />
                  <circle cx="25" cy="60" r="1.5" fill="#4ADE80" />
                  <circle cx="28" cy="61" r="1.5" fill="#4ADE80" />

                  {/* Right Face Server slots */}
                  <line x1="57" y1="52" x2="78" y2="42" stroke="#93C5FD" strokeWidth="1.5" opacity="0.6" />
                  <line x1="57" y1="62" x2="78" y2="52" stroke="#93C5FD" strokeWidth="1.5" opacity="0.6" />
                  <line x1="57" y1="72" x2="78" y2="62" stroke="#93C5FD" strokeWidth="1.5" opacity="0.6" />
                </svg>
              </div>

              {/* Motivational Quote Box */}
              <div className="w-full max-w-[220px] bg-[#0B132B] text-white p-3 rounded-xl border border-slate-700 shadow-md text-xs">
                <p className="italic text-slate-300 font-medium leading-tight">
                  {language === 'th' ? <>&ldquo;ก้าวเล็ก ๆ ในวันนี้<br />สู่วิศวกรเครือข่ายในวันหน้า&rdquo;</> : <>&ldquo;Small steps today,<br /><span className="text-[#22C55E] font-semibold">Network Engineer</span> tomorrow.&rdquo;</>}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Five Metric Cards in a Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {/* Card 1: Level */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400">{language === 'th' ? 'ระดับ' : 'Level'}</div>
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    {user?.level || 2}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#22C55E] rounded-full w-3/4" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  760 / 1,000 XP
                </div>
              </div>
            </div>

            {/* Card 2: Total XP */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 fill-blue-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400">{language === 'th' ? 'XP รวม' : 'Total XP'}</div>
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    {user?.total_xp?.toLocaleString() || '1,240'}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 font-medium">
                {language === 'th' ? 'คะแนนสะสมทั้งหมด' : 'Lifetime earned'}
              </div>
            </div>

            {/* Card 3: Missions Completed */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400">{language === 'th' ? 'ภารกิจที่สำเร็จ' : 'Missions Completed'}</div>
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    3 <span className="text-xs font-normal text-slate-400">/ 12</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 font-medium">
                {language === 'th' ? '25% ของหลักสูตร' : '25% of curriculum'}
              </div>
            </div>

            {/* Card 4: Flags Captured */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <Flag className="w-5 h-5 fill-rose-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400">{language === 'th' ? 'ธงที่พิชิตได้' : 'Flags Captured'}</div>
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    {user?.flags_captured || 3}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 font-medium">
                {language === 'th' ? 'ธงที่ยืนยันแล้ว' : 'Verified flags'}
              </div>
            </div>

            {/* Card 5: Current Streak */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 fill-amber-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400">{language === 'th' ? 'เรียนต่อเนื่อง' : 'Current Streak'}</div>
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    {user?.streak_days || 7} <span className="text-xs font-normal text-slate-400">{language === 'th' ? 'วัน' : 'days'}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 font-medium">
                {language === 'th' ? 'ทำต่อไป!' : 'Keep it going!'}
              </div>
            </div>
          </div>

          <WeeklyProgressChart />

          {/* 3. Hero Continue Learning Card (Dark Cyber Card with 3D Switch) */}
          <div className="bg-[#0B132B] border border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            {/* Background cyber grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
              {/* Left Info Column */}
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#22C55E] tracking-wider uppercase">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    {language === 'th' ? 'เรียนต่อ' : 'Continue Learning'}
                  </span>
                </div>

                <div>
                  <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {language === 'th' ? 'ภารกิจ 05' : 'Mission 05'}
                  </div>
                  <div className="text-lg md:text-xl font-bold text-slate-200 mt-1">
                    {language === 'th' ? 'พอร์ต Switch ถูกปิดโดยผู้ดูแล' : 'Administratively Shutdown Switch Port'}
                  </div>
                </div>

                {/* Badges: Intermediate, 20 min, 150 XP */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-amber-300">
                    <Signal className="w-3.5 h-3.5" />
                    {language === 'th' ? 'ปานกลาง' : 'Intermediate'}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-slate-300">
                    <Clock className="w-3.5 h-3.5" />
                    {language === 'th' ? '20 นาที' : '20 min'}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-amber-400">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    150 XP
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 max-w-md pt-1">
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-[#22C55E] rounded-full w-1/2 transition-all" />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {language === 'th' ? 'สำเร็จ 50%' : '50% complete'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <button
                    id="dash-continue-hero-btn"
                    onClick={() => onSelectMission(5)}
                    className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:bg-[#16A34A] sm:w-auto"
                  >
                    <span>{language === 'th' ? 'ทำภารกิจต่อ' : 'Continue Mission'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    id="dash-view-details-hero-btn"
                    onClick={() => onSelectMission(5)}
                    className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800/80 sm:w-auto"
                  >
                    {language === 'th' ? 'ดูรายละเอียด' : 'View Details'}
                  </button>
                </div>
              </div>

              {/* Right Side: reusable isometric network switch illustration */}
              <div className="w-full shrink-0 xl:w-[46%] xl:max-w-[560px]">
                <IsometricNetworkSwitch className="h-auto w-full" />
              </div>
            </div>
          </div>

          {/* 4. Learning Progress by Network Domain */}
          <div className="space-y-3.5">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'th' ? 'ความคืบหน้าการเรียนรู้' : 'Learning Progress'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'th' ? 'ติดตามความคืบหน้าในทุกหัวข้อวิศวกรรมเครือข่าย' : 'Track your progress across all network engineering topics.'}
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('learning-path')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                <span>{language === 'th' ? 'ดูเส้นทางทั้งหมด' : 'View Full Path'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* 6 Topic Cards in a Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-3">
              {domainCards.map((domain, idx) => {
                const Icon = domain.icon;
                return (
                  <div 
                    key={idx}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2.5 flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${domain.bgLight}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 truncate" title={domain.name}>
                        {domain.name}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${domain.color}`}
                          style={{ width: `${domain.percent}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] font-mono font-bold text-slate-500">
                        {domain.percent}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Recommended Missions Grid */}
          <div className="space-y-3.5">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'th' ? 'ภารกิจแนะนำ' : 'Recommended Missions'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'th' ? 'เรียนรู้และฝึกฝนต่อกับภารกิจที่คัดสรรมาให้' : 'Continue your learning journey with these missions.'}
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('missions')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                <span>{language === 'th' ? 'ดูภารกิจทั้งหมด' : 'View All Missions'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Carousel / Grid of 3 Cards with right arrow */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedMissions.map((m) => (
                  <div
                    key={m.id}
                    id={`rec-mission-card-${m.id}`}
                    onClick={() => onSelectMission(m.id)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      {/* Badges: Difficulty, Time */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.diffColor}`}>
                          ★ {m.difficulty}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {m.time}
                        </span>
                      </div>

                      {/* Titles & Device Graphic */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                            {m.missionNo}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {m.title}
                          </h3>
                        </div>

                        {/* Device Vector Graphic */}
                        <div className="w-14 h-12 shrink-0 flex items-center justify-center">
                          {m.deviceType === 'router' && (
                            <svg viewBox="0 0 60 40" className="w-full h-full">
                              <rect x="12" y="18" width="36" height="14" rx="2" fill="#1E293B" />
                              <line x1="20" y1="18" x2="16" y2="6" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                              <line x1="40" y1="18" x2="44" y2="6" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                              <circle cx="20" cy="25" r="1.5" fill="#4ADE80" />
                              <circle cx="26" cy="25" r="1.5" fill="#4ADE80" />
                              <circle cx="32" cy="25" r="1.5" fill="#38BDF8" />
                            </svg>
                          )}
                          {m.deviceType === 'router_dual' && (
                            <svg viewBox="0 0 60 40" className="w-full h-full">
                              <rect x="10" y="16" width="40" height="15" rx="2" fill="#1E293B" />
                              <line x1="16" y1="16" x2="10" y2="5" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                              <line x1="44" y1="16" x2="50" y2="5" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                              <circle cx="18" cy="23" r="1.5" fill="#4ADE80" />
                              <circle cx="25" cy="23" r="1.5" fill="#F87171" />
                              <circle cx="32" cy="23" r="1.5" fill="#38BDF8" />
                            </svg>
                          )}
                          {m.deviceType === 'switch' && (
                            <svg viewBox="0 0 60 40" className="w-full h-full">
                              <rect x="8" y="14" width="44" height="18" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1" />
                              <rect x="14" y="22" width="6" height="5" fill="#020617" stroke="#38BDF8" strokeWidth="0.5" />
                              <rect x="23" y="22" width="6" height="5" fill="#020617" stroke="#38BDF8" strokeWidth="0.5" />
                              <rect x="32" y="22" width="6" height="5" fill="#020617" stroke="#38BDF8" strokeWidth="0.5" />
                              <rect x="41" y="22" width="6" height="5" fill="#020617" stroke="#38BDF8" strokeWidth="0.5" />
                              <circle cx="17" cy="18" r="1" fill="#4ADE80" />
                              <circle cx="26" cy="18" r="1" fill="#4ADE80" />
                              <circle cx="35" cy="18" r="1" fill="#4ADE80" />
                            </svg>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-500">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        {m.xp} XP
                      </span>
                      <span className="text-slate-400 hover:text-slate-900 flex items-center gap-0.5 text-[11px] font-semibold">
                        {language === 'th' ? 'เริ่มภารกิจ' : 'Launch'} <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Next Arrow */}
              <button 
                onClick={() => onNavigateTab('missions')}
                className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-all z-10"
                title={language === 'th' ? 'ภารกิจถัดไป' : 'Next Missions'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN (4 COLS) ================= */}
        <div className="xl:col-span-4 space-y-6">

          {/* 1. Next Achievement Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="text-sm font-bold text-slate-900">
              {language === 'th' ? 'ความสำเร็จถัดไป' : 'Next Achievement'}
            </div>

            <div className="flex items-center gap-3.5">
              {/* Hexagonal Green Badge */}
              <div className="w-12 h-12 shrink-0 relative flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                  <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="#16A34A" />
                  <polygon points="50,10 84,27 84,73 50,90 16,73 16,27" fill="#22C55E" />
                </svg>
                <Wrench className="w-5 h-5 text-white absolute" />
              </div>

              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900">
                  {language === 'th' ? 'นักแก้ปัญหาเครือข่าย' : 'Troubleshooter'}
                </div>
                <div className="text-xs text-slate-500 leading-tight">
                  {language === 'th' ? 'ทำภารกิจแก้ไขปัญหาให้สำเร็จ 5 ภารกิจ' : 'Complete 5 troubleshooting missions.'}
                </div>
              </div>
            </div>

            {/* Progress Bar 3 / 5 */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 font-normal">{language === 'th' ? 'ความคืบหน้า' : 'Progress'}</span>
                <span className="text-slate-800 font-mono">3 / 5</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E] rounded-full w-3/5" />
              </div>
            </div>
          </div>

          {/* 2. Master Networking Through Real Challenges Card */}
          <div className="bg-gradient-to-br from-[#0E1A33] via-[#0F1E3B] to-[#0A1428] border border-slate-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            {/* Stylized Mountain Peak & CTF Flag Background Graphic */}
            <div className="absolute right-0 bottom-0 w-44 h-36 pointer-events-none opacity-80">
              <svg viewBox="0 0 200 160" className="w-full h-full">
                {/* Dark Mountain Polygons */}
                <polygon points="40,160 120,40 180,160" fill="#1E293B" />
                <polygon points="120,40 150,90 180,160" fill="#0F172A" />
                <polygon points="0,160 60,70 120,160" fill="#334155" opacity="0.6" />
                <polygon points="110,160 160,80 200,160" fill="#1E3A8A" opacity="0.5" />
                
                {/* Mountain Snow Cap */}
                <polygon points="120,40 132,60 120,68 108,60" fill="#E2E8F0" />
                
                {/* Green CTF Flag Pole & Banner */}
                <line x1="120" y1="40" x2="120" y2="15" stroke="#E2E8F0" strokeWidth="2.5" />
                <polygon points="120,15 155,26 120,38" fill="#22C55E" />
              </svg>
            </div>

            <div className="space-y-2 relative z-10 max-w-[240px]">
              <h3 className="text-xl font-black text-white leading-tight">
                {language === 'th' ? <>เชี่ยวชาญระบบเครือข่าย<br />ผ่านโจทย์จากสถานการณ์จริง</> : <>Master Networking<br />Through Real Challenges</>}
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                {language === 'th' ? 'พัฒนาทักษะผ่านแล็บ สถานการณ์จริง และภารกิจรูปแบบ CTF' : 'Hands-on labs, real scenarios, and CTF-style missions to build your skills.'}
              </p>
            </div>

            <div className="relative z-10 pt-4">
              <button
                id="dash-explore-learning-paths-btn"
                onClick={() => onNavigateTab('learning-path')}
                className="px-4 py-2.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all group"
              >
                <span>{language === 'th' ? 'สำรวจเส้นทางการเรียนรู้' : 'Explore Learning Paths'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 3. Weekly Challenge Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                {language === 'th' ? 'ภารกิจประจำสัปดาห์' : 'Weekly Challenge'}
              </div>
              <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                <Clock className="w-3 h-3 text-slate-400" />
                5D 12H 23M
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              {/* Bullseye target icon */}
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <div className="w-7 h-7 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900">
                  {language === 'th' ? 'นักสืบเครือข่าย' : 'Network Detective'}
                </div>
                <div className="text-xs text-slate-500 leading-tight">
                  {language === 'th' ? 'ทำภารกิจแก้ไขปัญหาให้สำเร็จ 3 ภารกิจในสัปดาห์นี้' : 'Complete 3 troubleshooting missions this week.'}
                </div>
              </div>
            </div>

            {/* Progress Bar 1 / 3 */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 font-normal">{language === 'th' ? 'ความคืบหน้า' : 'Progress'}</span>
                <span className="text-slate-800 font-mono">1 / 3</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E] rounded-full w-1/3" />
              </div>
            </div>
          </div>

          {/* 4. Recent Activity Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                {language === 'th' ? 'กิจกรรมล่าสุด' : 'Recent Activity'}
              </div>
              <button
                onClick={() => onNavigateTab('achievements')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                {language === 'th' ? 'ดูทั้งหมด' : 'View All'}
              </button>
            </div>

            <div className="divide-y divide-slate-100 space-y-3">
              {/* Row 1: Completed Mission 03 */}
              <div className="flex items-start justify-between gap-3 pt-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {language === 'th' ? 'สำเร็จภารกิจ 03' : 'Completed Mission 03'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'th' ? 'การแก้ไขปัญหา VLAN' : 'VLAN Troubleshooting'}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#22C55E] font-mono">
                    +150 XP
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === 'th' ? '2 ชั่วโมงที่แล้ว' : '2 hours ago'}
                  </div>
                </div>
              </div>

              {/* Row 2: Captured a Flag */}
              <div className="flex items-start justify-between gap-3 pt-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Flag className="w-3.5 h-3.5 fill-rose-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {language === 'th' ? 'พิชิตธงแล้ว' : 'Captured a Flag'}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      FLAG&#123;VLAN_MISCONFIG&#125;
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#22C55E] font-mono">
                    +50 XP
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === 'th' ? '2 ชั่วโมงที่แล้ว' : '2 hours ago'}
                  </div>
                </div>
              </div>

              {/* Row 3: Started Mission 05 */}
              <div className="flex items-start justify-between gap-3 pt-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Play className="w-3.5 h-3.5 fill-blue-600 ml-0.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {language === 'th' ? 'เริ่มภารกิจ 05' : 'Started Mission 05'}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {language === 'th' ? 'พอร์ต Switch ถูกปิดโดยผู้ดูแล' : 'Administratively Shutdown Switch Port'}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-400 font-mono">
                    -
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === 'th' ? '3 ชั่วโมงที่แล้ว' : '3 hours ago'}
                  </div>
                </div>
              </div>

              {/* Row 4: Used a Hint */}
              <div className="flex items-start justify-between gap-3 pt-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {language === 'th' ? 'ใช้คำใบ้' : 'Used a Hint'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'th' ? 'ภารกิจ 04' : 'Mission 04'}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-rose-500 font-mono">
                    -10 XP
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === 'th' ? '1 วันที่แล้ว' : '1 day ago'}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
