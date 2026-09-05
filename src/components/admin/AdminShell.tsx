import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
import { AdminPlaceholderPage } from '../../pages/admin/AdminPlaceholderPage';
import { AdminUsersPage } from '../../pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from '../../pages/admin/AdminUserDetailPage';
import { AdminMissionsPage } from '../../pages/admin/AdminMissionsPage';
import { AdminMissionEditorPage } from '../../pages/admin/AdminMissionEditorPage';
import { AdminPacketTracerPage } from '../../pages/admin/AdminPacketTracerPage';
import { AdminLearningPathsPage } from '../../pages/admin/AdminLearningPathsPage';
import { AdminAchievementsPage } from '../../pages/admin/AdminAchievementsPage';
import { AdminAssessmentsPage } from '../../pages/admin/AdminAssessmentsPage';
import { AdminAnalyticsPage } from '../../pages/admin/AdminAnalyticsPage';
import { AdminReportsPage } from '../../pages/admin/AdminReportsPage';
import { AdminActivityPage } from '../../pages/admin/AdminActivityPage';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { adminNavItems, findAdminNavItem } from './adminNavigation';

interface AdminShellProps {
  user: User;
  onSwitchToUser: () => void;
  onLogout: () => Promise<void>;
}

export const AdminShell: React.FC<AdminShellProps> = ({ user, onSwitchToUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem('network-ctf-admin-sidebar') === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentItem = findAdminNavItem(location.pathname);

  useEffect(() => {
    window.localStorage.setItem('network-ctf-admin-sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  return (
    <div className="admin-shell min-h-screen bg-[#080D18] text-white">
      {mobileOpen && <button type="button" className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close admin navigation" />}
      <AdminSidebar
        pathname={location.pathname}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
        onNavigate={(path) => navigate(path)}
        onSwitchToUser={onSwitchToUser}
        onLogout={() => { void onLogout(); }}
      />

      <div className={`min-h-screen transition-[padding] duration-[250ms] ease-out ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]'}`}>
        <AdminTopBar user={user} currentItem={currentItem} onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/missions" element={<AdminMissionsPage />} />
            <Route path="/admin/missions/new" element={<AdminMissionEditorPage />} />
            <Route path="/admin/missions/:id/edit" element={<AdminMissionEditorPage />} />
            <Route path="/admin/packet-tracer" element={<AdminPacketTracerPage />} />
            <Route path="/admin/learning-paths" element={<AdminLearningPathsPage />} />
            <Route path="/admin/achievements" element={<AdminAchievementsPage />} />
            <Route path="/admin/assessments" element={<AdminAssessmentsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/activity" element={<AdminActivityPage />} />
            {adminNavItems.filter((item) => !['/admin', '/admin/users', '/admin/missions', '/admin/packet-tracer', '/admin/learning-paths', '/admin/achievements', '/admin/assessments', '/admin/analytics', '/admin/reports', '/admin/activity'].includes(item.path)).map((item) => (
              <React.Fragment key={item.path}>
                <Route path={`${item.path}/*`} element={<AdminPlaceholderPage title={item.label} description={item.description} icon={item.icon} />} />
              </React.Fragment>
            ))}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
