import React, { useEffect, useState } from 'react';
import { AlertTriangle, Binary, Network, Route, Terminal } from 'lucide-react';
import { Mission } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { localizeMission } from '../context/contentLocalization';
import { StageSection } from '../components/ui/StageSection';

interface LearningPathPageProps {
  onSelectMission: (missionId: number) => void;
}

export const LearningPathPage: React.FC<LearningPathPageProps> = ({ onSelectMission }) => {
  const { language, t } = useLanguage();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMissions = async () => {
      try {
        setLoading(true);
        const response = await api.getMissions();
        setMissions(response.missions);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadMissions();
  }, []);

  const stages = [
    {
      stage: 1,
      title: language === 'th' ? 'พื้นฐานระบบเครือข่าย' : 'Network Fundamentals',
      subtitle: language === 'th'
        ? 'การเชื่อมต่อชั้นกายภาพ การกำหนด IPv4 และการคำนวณ VLSM Subnetting'
        : 'Layer 1 Physical Connectivity, IPv4 Addressing & VLSM Subnetting',
      icon: Network,
      accent: '#22D3EE',
    },
    {
      stage: 2,
      title: language === 'th' ? 'สถาปัตยกรรม Switching & Gateway' : 'Switching & Gateway Architecture',
      subtitle: language === 'th'
        ? 'การจัดการพอร์ต Switch การแบ่งเซกเมนต์ VLAN และ Default Gateway'
        : 'Switch Port Administration, VLAN Segmentation & Default Gateway Resolution',
      icon: Terminal,
      accent: '#8B5CF6',
    },
    {
      stage: 3,
      title: language === 'th' ? 'การทำ Routing และบริการเครือข่าย' : 'Routing & Network Services',
      subtitle: language === 'th'
        ? '802.1Q Inter-Switch Trunking เส้นทาง Static Route และ OSPF Dynamic Routing'
        : '802.1Q Inter-Switch Trunking, Static Routes & OSPF Dynamic Adjacencies',
      icon: Route,
      accent: '#3B82F6',
    },
    {
      stage: 4,
      title: language === 'th' ? 'การแก้ปัญหาเครือข่ายและรับมือเหตุขัดข้อง' : 'Troubleshooting & Incident Response',
      subtitle: language === 'th'
        ? 'DHCP Relay Agent ระบบ DNS องค์กร และวิกฤตการณ์เครือข่ายล่มแบบหลายเลเยอร์'
        : 'DHCP Helper Relay, Corporate Split-DNS & Multi-Layer Incident Meltdown',
      icon: AlertTriangle,
      accent: '#F59E0B',
    },
  ];

  const completedMissions = missions.filter((mission) => mission.status === 'completed').length;
  const localizedMissions = missions.map((mission) => localizeMission(mission, language));

  return (
    <div className="dashboard-page-theme tech-page mx-auto max-w-[1500px] space-y-8 animate-in fade-in duration-300">
      <header className="page-hero tech-grid-bg">
        <div className="page-hero-orb page-hero-orb-cyan" />
        <div className="page-hero-orb page-hero-orb-violet" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <span className="eyebrow-chip"><Binary className="h-4 w-4" />{language === 'th' ? 'แผนการเรียนรู้ตามลำดับ' : 'Curriculum roadmap'}</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--ctf-text)] md:text-4xl">{t('path.title')}</h1>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-[var(--ctf-muted)]">{t('path.subtitle')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="summary-chip"><strong>{stages.length}</strong>{language === 'th' ? 'ด่านการเรียนรู้' : 'learning stages'}</span>
            <span className="summary-chip"><strong>{missions.length}</strong>{language === 'th' ? 'ภารกิจทั้งหมด' : 'total missions'}</span>
            <span className="summary-chip summary-chip-success"><strong>{completedMissions}</strong>{language === 'th' ? 'ภารกิจที่สำเร็จ' : 'completed'}</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="space-y-6" aria-label={language === 'th' ? 'กำลังโหลดเส้นทางการเรียนรู้' : 'Loading learning path'}>
          {[1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-[var(--ctf-radius-xl)] bg-[var(--ctf-surface)] ring-1 ring-[var(--ctf-border)]" />)}
        </div>
      ) : (
        <div className="path-roadmap">
          {stages.map((stage, index) => (
            <StageSection
              key={stage.stage}
              {...stage}
              missions={localizedMissions.filter((mission) => mission.stage === stage.stage)}
              isLast={index === stages.length - 1}
              onSelectMission={onSelectMission}
            />
          ))}
        </div>
      )}
    </div>
  );
};
