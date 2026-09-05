/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { User } from './types';
import { api } from './services/api';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { TopNav } from './components/layout/TopNav';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LearningPathPage } from './pages/LearningPathPage';
import { MissionsListPage } from './pages/MissionsListPage';
import { MissionRoomPage } from './pages/MissionRoomPage';
import { PacketTracerLabsPage } from './pages/PacketTracerLabsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AssessmentPage } from './pages/AssessmentPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AdminShell } from './components/admin/AdminShell';
import { LearningActivityTracker } from './components/learning/LearningActivityTracker';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

type Theme = 'light' | 'dark';

const tabPaths: Record<string, string> = {
  dashboard: '/dashboard',
  'learning-path': '/learning-paths',
  missions: '/missions',
  'packet-tracer': '/packet-tracer',
  leaderboard: '/leaderboard',
  achievements: '/achievements',
  profile: '/profile',
  assessment: '/assessment',
  admin: '/admin',
};

function getCurrentTab(pathname: string): string {
  // The mission detail page belongs to the Missions top-level navigation item.
  // Returning a separate `mission-room` id leaves every TopNav item inactive.
  if (pathname.startsWith('/missions')) return 'missions';
  if (pathname.startsWith('/learning-paths')) return 'learning-path';
  if (pathname.startsWith('/packet-tracer')) return 'packet-tracer';
  if (pathname.startsWith('/leaderboard')) return 'leaderboard';
  if (pathname.startsWith('/achievements')) return 'achievements';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/assessment')) return 'assessment';
  return 'dashboard';
}

interface MissionRouteProps {
  onUserStatsUpdated: () => Promise<void>;
}

const MissionRoute: React.FC<MissionRouteProps> = ({ onUserStatsUpdated }) => {
  const navigate = useNavigate();
  const { missionId } = useParams();
  const parsedMissionId = Number(missionId);

  if (!Number.isInteger(parsedMissionId) || parsedMissionId <= 0) {
    return <Navigate to="/missions" replace />;
  }

  return (
    <MissionRoomPage
      missionId={parsedMissionId}
      onBackToMissions={() => navigate('/missions')}
      onNavigateMission={(nextId) => navigate(`/missions/${nextId}`)}
      onUserStatsUpdated={onUserStatsUpdated}
    />
  );
};

interface UserShellProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => Promise<void>;
}

const UserShell: React.FC<UserShellProps> = ({ user, onUserUpdated, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('network-ctf-theme') === 'dark' ? 'dark' : 'light';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [routeLeaving, setRouteLeaving] = useState(false);
  const navigationTimer = useRef<number | null>(null);

  useEffect(() => {
    window.localStorage.setItem('network-ctf-theme', theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

  useEffect(() => () => {
    if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current);
  }, []);

  const navigateWithTransition = (destination: string) => {
    if (destination === location.pathname || routeLeaving) return;
    setRouteLeaving(true);
    navigationTimer.current = window.setTimeout(() => {
      navigate(destination);
      window.requestAnimationFrame(() => setRouteLeaving(false));
      navigationTimer.current = null;
    }, 240);
  };

  const navigateToTab = (tab: string) => {
    navigateWithTransition(tabPaths[tab] || '/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshUserStats = async () => {
    const response = await api.getMe();
    onUserUpdated(response.user);
  };

  return (
    <div className={`app-shell min-h-screen overflow-x-hidden font-sans antialiased selection:bg-[#22C55E]/30 ${theme === 'dark' ? 'theme-dark bg-[#101214] text-[#F3F4F6]' : 'theme-light bg-[#F3F4F6] text-[#17191C]'}`}>
      <LearningActivityTracker pathname={location.pathname} />
      <TopNav
        user={user}
        currentTab={getCurrentTab(location.pathname)}
        onSelectTab={navigateToTab}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          if (!location.pathname.startsWith('/missions')) navigate('/missions');
        }}
        onNavigateProfile={() => navigate('/profile')}
        onLogout={() => { void onLogout(); }}
        mobileMenuOpen={mobileMenuOpen}
        theme={theme}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      />

      <div className="min-w-0 pt-20 transition-colors duration-300 lg:pt-24">
        <main className="content-readable mx-auto w-full max-w-[1760px] p-4 sm:p-6 xl:p-8">
          <div key={location.pathname} className={routeLeaving ? 'route-page-leaving' : 'route-page-enter'}>
            <Routes location={location}>
              <Route path="/dashboard" element={<DashboardPage user={user} onSelectMission={(id) => navigate(`/missions/${id}`)} onNavigateTab={navigateToTab} />} />
              <Route path="/learning-paths" element={<LearningPathPage onSelectMission={(id) => navigate(`/missions/${id}`)} />} />
              <Route path="/missions" element={<MissionsListPage onSelectMission={(id) => navigate(`/missions/${id}`)} searchQuery={searchQuery} />} />
              <Route path="/missions/:missionId" element={<MissionRoute onUserStatsUpdated={refreshUserStats} />} />
              <Route path="/packet-tracer" element={<PacketTracerLabsPage onSelectMission={(id) => navigate(`/missions/${id}`)} />} />
              <Route path="/leaderboard" element={<LeaderboardPage currentUser={user} />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/profile" element={<ProfilePage user={user} onNavigateTab={navigateToTab} />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

function AppContent() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const response = await api.getMe();
        setUser(response.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void checkCurrentUser();
  }, []);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    navigate(authenticatedUser.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B132B]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#22C55E] border-t-transparent" />
          <span className="text-xs font-mono text-slate-300">
            {language === 'th' ? 'กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...' : 'Verifying secure session...'}
          </span>
        </div>
      </div>
    );
  }

  if (location.pathname === '/login') {
    return user
      ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
      : <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (location.pathname === '/access-denied') {
    return <AccessDeniedPage isAuthenticated={Boolean(user)} onBack={() => navigate(user ? '/dashboard' : '/login')} />;
  }

  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (user.role !== 'admin') return <Navigate to="/access-denied" replace />;
    return <AdminShell user={user} onSwitchToUser={() => navigate('/dashboard')} onLogout={handleLogout} />;
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <UserShell user={user} onUserUpdated={setUser} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </LanguageProvider>
  );
}
