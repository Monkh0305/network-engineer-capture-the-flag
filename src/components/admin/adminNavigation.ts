import {
  Activity, Award, ChartNoAxesCombined, CircleHelp, ClipboardCheck,
  Download, FileBarChart, LayoutDashboard, Map, Settings, Target, Users,
  type LucideIcon,
} from 'lucide-react';
import type { Language } from '../../context/LanguageContext';

export type AdminNavGroup = 'overview' | 'management' | 'research' | 'system';

export interface AdminNavItem {
  path: string;
  label: Record<Language, string>;
  description: Record<Language, string>;
  icon: LucideIcon;
  group: AdminNavGroup;
}

export const adminNavItems: AdminNavItem[] = [
  { path: '/admin', label: { th: 'แดชบอร์ด', en: 'Dashboard' }, description: { th: 'ภาพรวมระบบสำหรับผู้ดูแล', en: 'Administrator system overview' }, icon: LayoutDashboard, group: 'overview' },
  { path: '/admin/users', label: { th: 'ผู้ใช้งาน', en: 'Users' }, description: { th: 'จัดการบัญชีและติดตามผู้เรียน', en: 'Manage accounts and learner records' }, icon: Users, group: 'management' },
  { path: '/admin/learning-paths', label: { th: 'เส้นทางการเรียนรู้', en: 'Learning Paths' }, description: { th: 'จัดโครงสร้างด่านและเส้นทางการเรียน', en: 'Organize stages and learning paths' }, icon: Map, group: 'management' },
  { path: '/admin/missions', label: { th: 'ภารกิจ', en: 'Missions' }, description: { th: 'จัดการเนื้อหาและลำดับภารกิจ', en: 'Manage mission content and ordering' }, icon: Target, group: 'management' },
  { path: '/admin/packet-tracer', label: { th: 'แล็บ Packet Tracer', en: 'Packet Tracer Labs' }, description: { th: 'จัดการไฟล์แล็บสำหรับภารกิจ', en: 'Manage mission lab files' }, icon: Download, group: 'management' },
  { path: '/admin/questions', label: { th: 'คำถาม', en: 'Questions' }, description: { th: 'จัดการคำถามและคำอธิบายคำตอบ', en: 'Manage questions and explanations' }, icon: CircleHelp, group: 'management' },
  { path: '/admin/achievements', label: { th: 'เหรียญเกียรติยศ', en: 'Achievements' }, description: { th: 'กำหนดเหรียญและเงื่อนไขการได้รับ', en: 'Configure badges and unlock rules' }, icon: Award, group: 'management' },
  { path: '/admin/assessments', label: { th: 'แบบทดสอบก่อนและหลังเรียน', en: 'Pre/Post Tests' }, description: { th: 'จัดการแบบประเมินผลการเรียนรู้', en: 'Manage academic assessments' }, icon: ClipboardCheck, group: 'research' },
  { path: '/admin/analytics', label: { th: 'การวิเคราะห์การเรียนรู้', en: 'Learning Analytics' }, description: { th: 'วิเคราะห์ประสิทธิผลของการเรียน', en: 'Analyze learning effectiveness' }, icon: ChartNoAxesCombined, group: 'research' },
  { path: '/admin/reports', label: { th: 'รายงาน', en: 'Reports' }, description: { th: 'ตรวจสอบรายงานสำหรับงานวิจัย', en: 'Review research-oriented reports' }, icon: FileBarChart, group: 'research' },
  { path: '/admin/activity', label: { th: 'บันทึกกิจกรรม', en: 'Activity Logs' }, description: { th: 'ตรวจสอบเหตุการณ์ที่เกิดขึ้นในระบบ', en: 'Review system activity events' }, icon: Activity, group: 'system' },
  { path: '/admin/settings', label: { th: 'การตั้งค่า', en: 'Settings' }, description: { th: 'ตั้งค่าพื้นฐานของระบบ', en: 'Configure core system preferences' }, icon: Settings, group: 'system' },
];

export const adminGroupLabels: Record<Exclude<AdminNavGroup, 'overview'>, Record<Language, string>> = {
  management: { th: 'การจัดการ', en: 'MANAGEMENT' },
  research: { th: 'งานวิจัย', en: 'RESEARCH' },
  system: { th: 'ระบบ', en: 'SYSTEM' },
};

export function findAdminNavItem(pathname: string): AdminNavItem {
  return [...adminNavItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => item.path === '/admin' ? pathname === '/admin' : pathname.startsWith(item.path))
    || adminNavItems[0];
}
