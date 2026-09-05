import React, { useState } from 'react';
import { Network, Terminal, ShieldAlert, Flag, ArrowRight, CheckCircle2, Lock, Mail, User as UserIcon, Languages } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('student@capstone.edu');
  const [username, setUsername] = useState('cadet_networker');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister 
        ? { username, email, password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(language === 'th' ? 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง' : (data.error || 'Authentication failed'));
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(language === 'th' ? 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง' : (err.message || 'An error occurred during authentication'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('student@capstone.edu');
    setPassword('demo123');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'student@capstone.edu', password: 'demo123' })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onLoginSuccess(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F14] text-[#F4F6F8] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Cyber Glow & Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#263241 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00C2FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#F5C542]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-5xl bg-[#111820] border border-[#263241] rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        
        {/* Left Section: Branding & Highlights (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-[#263241] flex flex-col justify-between space-y-8 bg-gradient-to-br from-[#111820] via-[#111820] to-[#161F29]">
          <div>
            {/* Top row with Logo and Language Toggle */}
            <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#161F29] border border-[#F5C542]/40 flex items-center justify-center text-[#F5C542] shadow-md">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-extrabold text-base tracking-wide text-[#F4F6F8] flex items-center gap-1.5">
                    <span>{t('login.title')}</span>
                  </div>
                  <div className="text-xs text-[#8D9BA8] font-mono">{t('login.subtitle')}</div>
                </div>
              </div>

              {/* Language Switcher */}
              <button
                id="login-lang-switch"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F29] hover:bg-[#263241] border border-[#263241] hover:border-[#F5C542]/50 text-xs font-mono font-bold transition-all text-[#F4F6F8]"
              >
                <Languages className="w-4 h-4 text-[#F5C542]" />
                <span className={language === 'th' ? 'text-[#F5C542]' : 'text-[#8D9BA8]'}>ไทย</span>
                <span className="text-[#263241]">/</span>
                <span className={language === 'en' ? 'text-[#00C2FF]' : 'text-[#8D9BA8]'}>EN</span>
              </button>
            </div>

            {/* Headline & Description */}
            <div className="mt-8 space-y-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#F4F6F8] leading-tight">
                {t('login.hero_heading')}
              </h1>
              <p className="text-sm text-[#8D9BA8] leading-relaxed max-w-lg">
                {t('login.hero_desc')}
              </p>
            </div>
          </div>

          {/* Three Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0B0F14]/70 border border-[#263241] space-y-2">
              <div className="w-7 h-7 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center text-[#00C2FF]">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-[#F4F6F8]">{t('login.feat_labs_title')}</div>
              <div className="text-[11px] text-[#8D9BA8] leading-snug">
                {t('login.feat_labs_desc')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0F14]/70 border border-[#263241] space-y-2">
              <div className="w-7 h-7 rounded-lg bg-[#F5C542]/10 border border-[#F5C542]/30 flex items-center justify-center text-[#F5C542]">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-[#F4F6F8]">{t('login.feat_troubleshoot_title')}</div>
              <div className="text-[11px] text-[#8D9BA8] leading-snug">
                {t('login.feat_troubleshoot_desc')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0F14]/70 border border-[#263241] space-y-2">
              <div className="w-7 h-7 rounded-lg bg-[#2ECC71]/10 border border-[#2ECC71]/30 flex items-center justify-center text-[#2ECC71]">
                <Flag className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-[#F4F6F8]">{t('login.feat_ctf_title')}</div>
              <div className="text-[11px] text-[#8D9BA8] leading-snug">
                {t('login.feat_ctf_desc')}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#8D9BA8] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] inline-block animate-pulse"></span>
            <span>{t('login.research_tag')}</span>
          </div>
        </div>

        {/* Right Section: Auth Form (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-8 md:p-10 flex flex-col justify-center space-y-6 bg-[#111820]">
          {/* Form Tabs */}
          <div className="flex border-b border-[#263241]">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`pb-3 text-xs font-bold transition-all mr-6 relative ${
                !isRegister ? 'text-[#F5C542]' : 'text-[#8D9BA8] hover:text-[#F4F6F8]'
              }`}
            >
              <span>{t('login.tab_login')}</span>
              {!isRegister && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5C542]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`pb-3 text-xs font-bold transition-all relative ${
                isRegister ? 'text-[#F5C542]' : 'text-[#8D9BA8] hover:text-[#F4F6F8]'
              }`}
            >
              <span>{t('login.tab_register')}</span>
              {isRegister && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5C542]" />
              )}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8D9BA8]">{t('login.username')}</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9BA8]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. net_cadet24"
                    className="w-full bg-[#0B0F14] border border-[#263241] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F4F6F8] focus:outline-none focus:border-[#F5C542]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8D9BA8]">{t('login.email')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9BA8]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full bg-[#0B0F14] border border-[#263241] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F4F6F8] focus:outline-none focus:border-[#F5C542]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#8D9BA8]">{t('login.password')}</label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => alert(language === 'th' ? 'สำหรับผู้ทดสอบโครงงาน รหัสผ่านคือ: demo123' : 'For capstone demo, password is: demo123')}
                    className="text-[11px] text-[#00C2FF] hover:underline"
                  >
                    {t('login.forgot_pwd')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9BA8]" />
                <input
                  type="password"
                  required
                  minLength={isRegister ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0B0F14] border border-[#263241] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F4F6F8] focus:outline-none focus:border-[#F5C542]"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded bg-[#FF5252]/10 border border-[#FF5252]/40 text-xs text-[#FF5252]">
                {error}
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#F5C542] text-[#0B0F14] font-bold text-xs hover:bg-[#F5C542]/90 transition-all shadow-[0_0_15px_rgba(245,197,66,0.25)] flex items-center justify-center gap-2"
            >
              <span>{loading ? (language === 'th' ? 'กำลังยืนยันข้อมูล...' : 'Authenticating...') : isRegister ? t('login.btn_register') : t('login.btn_login')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access for Capstone Evaluators */}
          <div className="pt-2 border-t border-[#263241]/70 space-y-2">
            <div className="text-[11px] text-[#8D9BA8] text-center font-mono">
              {t('login.quick_demo')}
            </div>
            <button
              type="button"
              id="demo-student-login-btn"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-[#161F29] hover:bg-[#263241] text-[#00C2FF] border border-[#263241] text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('login.btn_demo')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
