import React from 'react';
import { Construction, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AdminPlaceholderPageProps {
  title: { th: string; en: string };
  description: { th: string; en: string };
  icon: LucideIcon;
}

export const AdminPlaceholderPage: React.FC<AdminPlaceholderPageProps> = ({ title, description, icon: Icon }) => {
  const { language } = useLanguage();

  return (
    <section className="admin-placeholder-card relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/65 p-6 shadow-2xl sm:p-9">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.1)]">
          <Icon className="h-7 w-7" />
        </div>
        <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-violet-300">ADMIN MODULE</p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title[language]}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">{description[language]}</p>

        <div className="mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-400/[0.06] p-4 text-amber-100">
          <Construction className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div>
            <div className="text-sm font-bold">{language === 'th' ? 'เตรียมโครงสร้างหน้าเรียบร้อยแล้ว' : 'Page structure is ready'}</div>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {language === 'th'
                ? 'หน้านี้เป็น placeholder สำหรับตรวจสอบ Navigation และ Responsive เท่านั้น ระบบข้อมูลจะพัฒนาในขั้นตอนที่กำหนดภายหลัง'
                : 'This placeholder validates navigation and responsive behavior only. Data features will be implemented in their designated later step.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
