import React from 'react';
import { ArrowLeft, ShieldX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AccessDeniedPageProps {
  isAuthenticated: boolean;
  onBack: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ isAuthenticated, onBack }) => {
  const { language } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080D18] p-5 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-slate-900/80 p-7 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-red-300">
          <ShieldX className="h-8 w-8" />
        </div>
        <p className="mt-6 font-mono text-xs font-bold tracking-[0.22em] text-red-300">ACCESS DENIED</p>
        <h1 className="mt-2 text-2xl font-black">
          {language === 'th' ? 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ' : 'You do not have administrator access'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {language === 'th'
            ? 'บัญชี USER ไม่สามารถเปิดหน้า ADMIN ได้ หากคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ'
            : 'USER accounts cannot open ADMIN routes. Contact an administrator if you believe this is an error.'}
        </p>
        <button type="button" onClick={onBack} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300">
          <ArrowLeft className="h-4 w-4" />
          {isAuthenticated
            ? (language === 'th' ? 'กลับหน้าแดชบอร์ด' : 'Back to dashboard')
            : (language === 'th' ? 'ไปหน้าเข้าสู่ระบบ' : 'Go to login')}
        </button>
      </section>
    </main>
  );
};
