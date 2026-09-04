import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Play, 
  Terminal, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Mission } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { localizeMission } from '../context/contentLocalization';

interface MissionsListPageProps {
  onSelectMission: (missionId: number) => void;
  searchQuery: string;
}

export const MissionsListPage: React.FC<MissionsListPageProps> = ({
  onSelectMission,
  searchQuery
}) => {
  const { language, t } = useLanguage();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const res = await api.getMissions();
      setMissions(res.missions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Fundamental', 'IP Addressing', 'Subnetting', 'Switching', 'VLAN', 'Routing', 'Troubleshooting', 'Security'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
  const statuses = ['All', 'completed', 'in_progress', 'unlocked', 'locked'];
  const thaiCategory: Record<string, string> = {
    All: 'ทั้งหมด', Fundamental: 'พื้นฐานเครือข่าย', 'IP Addressing': 'การกำหนด IP',
    Subnetting: 'การแบ่ง Subnet', Switching: 'Switching', VLAN: 'VLAN', Routing: 'Routing',
    Troubleshooting: 'การแก้ไขปัญหา', Security: 'ความปลอดภัย'
  };

  const effectiveSearch = searchQuery || localSearch;

  const filteredMissions = missions.filter((m) => {
    const displayMission = localizeMission(m, language);
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory || (selectedCategory === 'Fundamental' && m.stage_name === 'Network Fundamentals');
    const matchesDifficulty = selectedDifficulty === 'All' || m.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === 'All' || m.status === selectedStatus;
    const matchesSearch = !effectiveSearch.trim() || 
      displayMission.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      displayMission.description.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      displayMission.category.toLowerCase().includes(effectiveSearch.toLowerCase());

    return matchesCategory && matchesDifficulty && matchesStatus && matchesSearch;
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': case 'ง่าย': return 'text-[#2ECC71] bg-[#2ECC71]/10 border-[#2ECC71]/30';
      case 'Medium': case 'ปานกลาง': return 'text-[#F5C542] bg-[#F5C542]/10 border-[#F5C542]/30';
      case 'Hard': case 'ยาก': return 'text-[#FF5252] bg-[#FF5252]/10 border-[#FF5252]/30';
      default: return 'text-[#8D9BA8] bg-[#8D9BA8]/10 border-[#263241]';
    }
  };

  return (
    <div className="dashboard-page-theme space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="dashboard-content-card relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-blue-100/80 blur-3xl" />
        <div>
          <h1 className="text-2xl font-black text-[#F4F6F8] tracking-tight">
            {t('missions.catalog_title')}
          </h1>
          <p className="text-xs text-[#8D9BA8] mt-1 font-mono">
            {t('missions.catalog_subtitle')}
          </p>
        </div>

        {/* Local Search */}
        <div className="relative z-10 w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9BA8]" />
          <input
            id="missions-local-search"
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={language === 'th' ? 'ค้นหาภารกิจ, ปัญหา...' : 'Search missions, flags...'}
            className="w-full bg-[#111820] border border-[#263241] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4F6F8] placeholder-[#8D9BA8]/60 focus:outline-none focus:border-[#F5C542]"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="dashboard-content-card space-y-3 p-4 bg-[#111820] border border-[#263241] rounded-xl">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-[#8D9BA8] mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> {t('missions.filter_category')}
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              id={`filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedCategory === cat
                  ? 'bg-[#F5C542] text-[#0B0F14] font-bold shadow-[0_0_12px_rgba(245,197,66,0.3)]'
                  : 'bg-[#161F29] text-[#8D9BA8] hover:text-[#F4F6F8] border border-[#263241]'
              }`}
            >
              {language === 'th' ? thaiCategory[cat] : cat}
            </button>
          ))}
        </div>

        {/* Difficulty Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#263241]">
          <span className="text-[11px] font-mono text-[#8D9BA8] mr-2">
            {t('missions.filter_difficulty')}
          </span>
          {difficulties.map((diff) => (
            <button
              key={diff}
              id={`filter-diff-${diff.toLowerCase()}`}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-2.5 py-0.5 rounded text-xs font-mono transition-all ${
                selectedDifficulty === diff
                  ? 'bg-[#00C2FF] text-[#0B0F14] font-bold'
                  : 'bg-[#161F29] text-[#8D9BA8] hover:text-[#F4F6F8] border border-[#263241]'
              }`}
            >
              {diff === 'All' ? (language === 'th' ? 'ทั้งหมด' : 'All') :
               diff === 'Easy' ? (language === 'th' ? 'ง่าย' : 'Easy') :
               diff === 'Medium' ? (language === 'th' ? 'ปานกลาง' : 'Medium') :
               (language === 'th' ? 'ยาก' : 'Hard')}
            </button>
          ))}
          <span className="text-[11px] font-mono text-[#8D9BA8] ml-auto">
            {t('missions.showing')} {filteredMissions.length} {t('missions.of')} {missions.length} {language === 'th' ? 'ภารกิจ' : 'Missions'}
          </span>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#263241]">
          <span className="text-[11px] font-mono text-[#8D9BA8] mr-2">
            {language === 'th' ? 'สถานะ:' : 'Status:'}
          </span>
          {statuses.map((status) => {
            const statusLabel = status === 'All'
              ? (language === 'th' ? 'ทั้งหมด' : 'All')
              : status === 'completed'
                ? (language === 'th' ? 'สำเร็จแล้ว' : 'Completed')
                : status === 'in_progress'
                  ? (language === 'th' ? 'กำลังปฏิบัติงาน' : 'In progress')
                  : status === 'unlocked'
                    ? (language === 'th' ? 'พร้อมเริ่ม' : 'Ready')
                    : (language === 'th' ? 'ล็อกอยู่' : 'Locked');

            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  selectedStatus === status
                    ? 'border-cyan-400/40 bg-gradient-to-r from-cyan-400/15 to-violet-500/15 text-[#00C2FF] shadow-[0_0_16px_rgba(34,211,238,0.1)]'
                    : 'border-[#263241] bg-[#161F29] text-[#8D9BA8] hover:border-cyan-400/30 hover:text-[#F4F6F8]'
                }`}
              >
                {statusLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredMissions.map((sourceMission) => {
          const mission = localizeMission(sourceMission, language);
          const isLocked = mission.status === 'locked';
          const isCompleted = mission.status === 'completed';
          const isCurrent = mission.status === 'in_progress' || (mission.status === 'unlocked' && !isCompleted);

          return (
            <div
              key={mission.id}
              id={`mission-card-${mission.order_index}`}
              onClick={() => !isLocked && onSelectMission(mission.id)}
              className={`dashboard-content-card group rounded-xl border p-5 flex flex-col justify-between space-y-4 transition-all duration-200 ${
                isLocked
                  ? 'bg-[#0B0F14]/60 border-[#263241]/60 opacity-60 cursor-not-allowed'
                  : 'bg-[#111820] border-[#263241] cursor-pointer hover:-translate-y-1 hover:border-[#F5C542] hover:shadow-[0_4px_25px_rgba(245,197,66,0.18)]'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8D9BA8]">
                    {language === 'th' ? 'ภารกิจ' : 'MISSION'} {String(mission.order_index).padStart(2, '0')}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getDifficultyColor(mission.difficulty)}`}>
                      {mission.difficulty}
                    </span>

                    {/* Status Badge */}
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#2ECC71] bg-[#2ECC71]/10 px-2 py-0.5 rounded border border-[#2ECC71]/40">
                        <CheckCircle2 className="w-3 h-3" /> {language === 'th' ? 'สำเร็จแล้ว' : 'SOLVED'}
                      </span>
                    ) : isCurrent ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#F5C542] bg-[#F5C542]/10 px-2 py-0.5 rounded border border-[#F5C542]/40">
                        <Play className="w-3 h-3" /> {language === 'th' ? 'กำลังทำ' : 'ACTIVE'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-[#8D9BA8] bg-[#263241]/40 px-2 py-0.5 rounded border border-[#263241]">
                        <Lock className="w-3 h-3" /> {language === 'th' ? 'ล็อก' : 'LOCKED'}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className={`text-sm font-bold transition-colors line-clamp-1 ${
                  isCurrent ? 'text-[#F5C542]' : 'text-[#F4F6F8] group-hover:text-[#F5C542]'
                }`}>
                  {mission.title}
                </h3>

                <p className="text-xs text-[#8D9BA8] line-clamp-2 leading-relaxed">
                  {mission.description}
                </p>
              </div>

              {/* Progress & Meta */}
              <div className="space-y-3 pt-2 border-t border-[#263241]/70">
                {/* Completion Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#8D9BA8]">{t('dash.progress')}</span>
                    <span className="font-bold text-[#F5C542]">{mission.completionPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0B0F14] rounded-full overflow-hidden border border-[#263241]">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        isCompleted ? 'bg-[#2ECC71]' : 'bg-[#F5C542]'
                      }`}
                      style={{ width: `${mission.completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Footer Badges & Action */}
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[#00C2FF] font-bold">+{mission.xp_reward} XP</span>
                    <span className="text-[#8D9BA8] text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {mission.estimated_time}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#F5C542] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>{isCompleted ? t('missions.review') : isLocked ? (language === 'th' ? 'ล็อก' : 'Locked') : t('missions.launch')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
