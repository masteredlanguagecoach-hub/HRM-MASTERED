// Main Application Bootstrap Entrypoint (AppShell Layout, Public Careers Portal, LoginPage & Fail-Closed Loading Guard)

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { AccessDenied } from './components/common/AccessDenied.jsx';
import { LoadingState } from './components/common/UIComponents.jsx';
import { PAGE_PERMISSION_MAP } from './config/constants.js';

import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { RecruitmentPage } from './pages/RecruitmentPage.jsx';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { EmployeesPage } from './pages/EmployeesPage.jsx';
import { AttendanceLeavePage } from './pages/AttendanceLeavePage.jsx';
import { PayrollPage } from './pages/PayrollPage.jsx';
import { TrainingPage } from './pages/TrainingPage.jsx';
import { PerformancePage } from './pages/PerformancePage.jsx';
import { ExitPage } from './pages/ExitPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { SystemHealthPage } from './pages/SystemHealthPage.jsx';
import { PublicCareersPage } from './pages/PublicCareersPage.jsx';

import './styles/app.css';

function MainContent() {
  const { activeTab, setActiveTab } = useApp();
  const { currentUser, hasAnyPermission, isAuthLoading } = useAuth();

  const isPublicCareersRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/careers') || activeTab === 'CareersPortal'
  );

  // Auto-redirect if active tab becomes unauthorized after role change
  useEffect(() => {
    if (isAuthLoading || isPublicCareersRoute || !currentUser) return;
    const requiredPermissions = PAGE_PERMISSION_MAP[activeTab];
    if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
      const firstAllowed = Object.keys(PAGE_PERMISSION_MAP).find(page => hasAnyPermission(PAGE_PERMISSION_MAP[page]));
      if (firstAllowed) {
        setActiveTab(firstAllowed);
      }
    }
  }, [currentUser?.Role, activeTab, isAuthLoading, isPublicCareersRoute]);

  // 1. PUBLIC ROUTES: Careers Portal accessible without account
  if (isPublicCareersRoute) {
    let jobId = null;
    if (window.location.pathname.includes('/jobs/')) {
      jobId = window.location.pathname.split('/jobs/')[1].split('/')[0];
    }
    return <PublicCareersPage initialRoute="/careers" jobId={jobId} />;
  }

  // 2. LOADING STATE
  if (isAuthLoading) {
    return <LoadingState message="Verifying role-based workspace session..." />;
  }

  // 3. UNAUTHENTICATED VISITORS REDIRECTED TO LOGIN PAGE
  if (!currentUser || currentUser.Status !== 'ACTIVE') {
    return <LoginPage />;
  }

  const renderPage = () => {
    const requiredPermissions = PAGE_PERMISSION_MAP[activeTab];

    if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
      return <AccessDenied pageName={activeTab} requiredPermission={requiredPermissions.join(' OR ')} />;
    }

    switch (activeTab) {
      case 'Dashboard': return <DashboardPage />;
      case 'Recruitment': return <RecruitmentPage />;
      case 'Onboarding': return <OnboardingPage />;
      case 'Employees': return <EmployeesPage />;
      case 'Attendance & Leave': return <AttendanceLeavePage />;
      case 'Payroll': return <PayrollPage />;
      case 'Training': return <TrainingPage />;
      case 'Performance': return <PerformancePage />;
      case 'Exit Management': return <ExitPage />;
      case 'Reports': return <ReportsPage />;
      case 'Settings': return <SettingsPage />;
      case 'System Health': return <SystemHealthPage />;
      case 'CareersPortal': return <PublicCareersPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <AppShell>
      {renderPage()}
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
}

// Universal Mounting Routine
function initAndMount() {
  const container = document.getElementById('root');
  if (container) {
    if (ReactDOM.createRoot) {
      try {
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(App, null));
        return;
      } catch (e) {
        console.warn('createRoot fallback to render:', e);
      }
    }
    ReactDOM.render(React.createElement(App, null), container);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAndMount);
  } else {
    initAndMount();
  }
}
