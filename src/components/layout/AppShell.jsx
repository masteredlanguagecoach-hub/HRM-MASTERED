// Application Shell Layout Container (Unified Single Shell Scroll Strategy)

import React, { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { MobileSidebar } from './MobileSidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { useApp } from '../../context/AppContext.jsx';

export function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toast } = useApp();

  return (
    <div className="app-shell">
      {/* Desktop Fixed Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Overlay */}
      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Viewport Container */}
      <div className="app-viewport">
        {/* Fixed Topbar Header */}
        <Topbar onToggleMobileSidebar={() => setMobileOpen(true)} />

        {/* Scrollable Main Viewport Area */}
        <main className="main-content-region">
          <div className="content-container">
            {children}
          </div>
        </main>
      </div>

      {/* Toast Notification Container */}
      {toast && (
        <div className="toast-container" role="status" aria-live="polite">
          <div className={`toast toast-${toast.type || 'success'}`}>
            <span style={{ fontSize: '16px' }}>{toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✓'}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
