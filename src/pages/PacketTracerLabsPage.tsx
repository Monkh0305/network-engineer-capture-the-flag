import React, { useEffect, useState } from 'react';
import { Terminal, Download, FileCode, Clock, Zap, CheckCircle2, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { Mission } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { localizeMission } from '../context/contentLocalization';

interface PacketTracerLabsPageProps {
  onSelectMission: (missionId: number) => void;
}

export const PacketTracerLabsPage: React.FC<PacketTracerLabsPageProps> = ({ onSelectMission }) => {
  const { language, t } = useLanguage();
  const [missions, setMissions] = useState<Mission[]>([]);
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

  const handleDownload = (filename: string) => {
    const url = api.getLabDownloadUrl(filename);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-page-theme space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="dashboard-content-card relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-cyan-100/80 blur-3xl" />
        <div>
          <h1 className="text-2xl font-black text-[#F4F6F8] tracking-tight">
            {t('pt.title')}
          </h1>
          <p className="text-xs text-[#8D9BA8] mt-1 font-mono">
            {t('pt.subtitle')}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-xs font-mono text-[#00C2FF]">
          <Terminal className="w-4 h-4" />
          <span>{language === 'th' ? 'รองรับ Packet Tracer 8.0 ขึ้นไป' : 'Compatible with Packet Tracer 8.0+'}</span>
        </div>
      </div>

      {/* Instructions Banner */}
      <div className="dashboard-content-card p-4 rounded-xl bg-[#111820] border border-[#263241] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#F4F6F8] flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#F5C542]" />
            <span>{t('pt.instructions_title')}</span>
          </div>
          <p className="text-[11px] text-[#8D9BA8] leading-relaxed">
            {t('pt.instructions_desc')}
          </p>
        </div>

        <a
          href="https://www.netacad.com/courses/packet-tracer"
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 rounded-lg bg-[#161F29] hover:bg-[#263241] text-[#00C2FF] border border-[#263241] text-xs font-mono shrink-0 flex items-center gap-1.5 transition-colors"
        >
          <span>{t('pt.get_pt')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {missions.map((sourceMission) => {
          const m = localizeMission(sourceMission, language);
          return (
          <div
            key={m.id}
            className="dashboard-content-card p-5 rounded-xl bg-[#111820] border border-[#263241] hover:border-[#F5C542]/50 transition-all flex flex-col justify-between space-y-4 shadow-md hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8D9BA8]">
                  {language === 'th' ? 'ภารกิจ' : 'MISSION'} {String(m.order_index).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30">
                  {m.category}
                </span>
              </div>

              <h3 className="text-xs font-bold text-[#F4F6F8] line-clamp-1">
                {m.title}
              </h3>

              <div className="p-2.5 rounded bg-[#0B0F14] border border-[#263241] font-mono text-xs flex items-center justify-between text-[#F5C542]">
                <span className="truncate">{m.packet_tracer_file}</span>
                <span className="text-[10px] text-[#8D9BA8] ml-2">.pka</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-[#8D9BA8]">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[#00C2FF]">Packet Tracer 8.0+</span>
                <span className="rounded-full border border-[#263241] bg-[#161F29] px-2 py-1">{language === 'th' ? 'ขนาดไฟล์: —' : 'File size: —'}</span>
              </div>

              <p className="text-[11px] text-[#8D9BA8] line-clamp-2 leading-relaxed">
                {m.description}
              </p>
            </div>

            <div className="pt-2 border-t border-[#263241]/70 flex items-center justify-between gap-2">
              <button
                onClick={() => handleDownload(m.packet_tracer_file)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500 to-violet-600 px-3 py-2.5 font-mono text-xs font-bold text-white shadow-[0_8px_24px_rgba(34,211,238,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(139,92,246,0.24)]"
              >
                <Download className="w-3.5 h-3.5 text-[#F5C542]" />
                <span>{t('pt.download_pka')}</span>
              </button>

              <button
                onClick={() => onSelectMission(m.id)}
                className="flex items-center gap-1 rounded-xl border border-[#263241] bg-[#161F29] px-3 py-2.5 text-xs font-bold text-[#F4F6F8] transition-colors hover:border-cyan-400/30 hover:text-[#00C2FF]"
              >
                <span>{t('pt.open_room')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};
