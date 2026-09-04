import React from 'react';
import { CheckCircle2, Lock, Play, Sparkles } from 'lucide-react';
import { MissionStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface StatusBadgeProps {
  status: MissionStatus;
  compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, compact = false }) => {
  const { language } = useLanguage();
  const config = status === 'completed'
    ? { icon: CheckCircle2, label: language === 'th' ? 'สำเร็จแล้ว' : 'Completed', className: 'status-complete' }
    : status === 'locked'
      ? { icon: Lock, label: language === 'th' ? 'ล็อกอยู่' : 'Locked', className: 'status-locked' }
      : status === 'in_progress'
        ? { icon: Play, label: language === 'th' ? 'กำลังปฏิบัติงาน' : 'In progress', className: 'status-active' }
        : { icon: Sparkles, label: language === 'th' ? 'พร้อมเริ่ม' : 'Ready', className: 'status-ready' };
  const Icon = config.icon;

  return (
    <span className={`status-pill ${config.className} ${compact ? 'status-pill-compact' : ''}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
