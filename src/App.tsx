/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api, setApiUserId } from './services/api';
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

type Theme = 'light' | 'dark';

function AppContent() {
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeMissionId, setActiveMissionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('network-ctf-theme') === 'dark' ? 'dark' : 'light';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize and check current user
  useEffect(() => {
    checkCurrentUser();
  }, []);

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

  const checkCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
        setApiUserId(res.user.id);
      }
    } catch (err) {
      console.warn('No active session, defaulting to login view:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setApiUserId(authenticatedUser.id);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    setUser(null);
    setApiUserId(null);
    setCurrentTab('dashboard');
    setActiveMissionId(null);
  };

  const handleSelectMission = (missionId: number) => {
    setActiveMissionId(missionId);
    setCurrentTab('mission-room');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshUserStats = async () => {
    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B132B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#22C55E] border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-slate-300">{language === 'th' ? 'กำลังเตรียมระบบ Network CTF...' : 'Initializing Network CTF Terminal...'}</span>
        </div>
      </div>
    );
  }

  // If user is not logged in, display the cyber login page
  if (!user) {
    return (
      <div className="app-shell theme-dark">
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className={`app-shell min-h-screen overflow-x-hidden font-sans antialiased selection:bg-[#22C55E]/30 ${theme === 'dark' ? 'theme-dark bg-[#101214] text-[#F3F4F6]' : 'theme-light bg-[#F3F4F6] text-[#17191C]'}`}>
      {/* Full-width Top Navigation Bar */}
      <TopNav
        user={user}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'mission-room') {
            setActiveMissionId(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (currentTab !== 'missions') {
            setCurrentTab('missions');
          }
        }}
        onNavigateProfile={() => {
          setCurrentTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        theme={theme}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      />

      <div className="min-w-0 pt-20 transition-colors duration-300 lg:pt-24">
        <main className="content-readable mx-auto w-full max-w-[1760px] p-4 sm:p-6 xl:p-8">
            {currentTab === 'dashboard' && (
              <DashboardPage
                user={user}
                onSelectMission={handleSelectMission}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'learning-path' && (
              <LearningPathPage onSelectMission={handleSelectMission} />
            )}

            {currentTab === 'missions' && (
              <MissionsListPage
                onSelectMission={handleSelectMission}
                searchQuery={searchQuery}
              />
            )}

            {currentTab === 'mission-room' && activeMissionId && (
              <MissionRoomPage
                missionId={activeMissionId}
                onBackToMissions={() => {
                  setCurrentTab('missions');
                  setActiveMissionId(null);
                }}
                onNavigateMission={(nextId) => {
                  setActiveMissionId(nextId);
                }}
                onUserStatsUpdated={refreshUserStats}
              />
            )}

            {currentTab === 'packet-tracer' && (
              <PacketTracerLabsPage onSelectMission={handleSelectMission} />
            )}

            {currentTab === 'leaderboard' && (
              <LeaderboardPage currentUser={user} />
            )}

            {currentTab === 'achievements' && (
              <AchievementsPage />
            )}

            {currentTab === 'profile' && (
              <ProfilePage
                user={user}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'assessment' && (
              <AssessmentPage />
            )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
