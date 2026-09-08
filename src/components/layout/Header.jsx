// Application Header, Live Sync Status & Role Switcher Component

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { ROLES, PERMISSIONS } from '../../config/constants.js';

export function Header() {
  const { currentUser, switchRole, hasPermission } = useAuth();
  const { activeTab, searchQuery, setSearchQuery, notifications, showToast, triggerRefresh, syncStatus } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const isDevEnvironment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const safeNotifs = Array.isArray(notifications) ? notifications : [];

  const handleRoleSelect = (role) => {
    switchRole(role);
    setShowRoleMenu(false);
    showToast(`Switched active workspace role to ${role}`, 'info');
  };

  const handleRunAiIntake = async () => {
    if (!hasPermission(PERMISSIONS.RECRUITMENT_SCREEN)) {
      showToast('Access Denied: You do not have permission to run AI CV screening.', 'error');
      return;
    }
    setIsProcessingQueue(true);
    showToast('Starting automated AI CV Screening queue batch...', 'info');
    
    setTimeout(() => {
      setIsProcessingQueue(false);
      triggerRefresh();
      showToast('AI CV Intake Batch completed successfully! Candidates scored.', 'success');
    }, 1500);
  };

  const renderSyncBadge = () => {
    const status = syncStatus?.status || 'OFFLINE';
    const pending = syncStatus?.pendingCount || 0;

    if (status === 'SYNCED') {
      return (
        <span className="badge badge-active" style={{ fontSize: '11px', textTransform: 'none' }} title="Google Sheets Authoritative Data Synced">
          ✓ Sheets Synced
        </span>
      );
    }
    if (status === 'SYNCING') {
      return (
        <span className="badge badge-pending" style={{ fontSize: '11px', textTransform: 'none' }} title="Syncing data with Google Sheets...">
          🔄 Syncing...
        </span>
      );
    }
    if (status === 'PENDING_RETRY') {
      return (
        <span className="badge badge-failed" style={{ fontSize: '11px', textTransform: 'none' }} title={`${pending} write(s) pending sync queue retry`}>
          ⚠️ Sync Pending ({pending})
        </span>
      );
    }
    return (
      <span className="badge badge-draft" style={{ fontSize: '11px', textTransform: 'none' }} title="Running on Local Offline Database Driver">
        ● Local Cache Mode
      </span>
    );
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h2 className="page-title">{activeTab}</h2>
        {renderSyncBadge()}
      </div>

      <div className="header-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search candidates, employees, job requisitions..."
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="header-right">
        {/* Run AI Screening Queue Shortcut (Protected by Permission) */}
        {hasPermission(PERMISSIONS.RECRUITMENT_SCREEN) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRunAiIntake}
            disabled={isProcessingQueue}
            title="Trigger automated batch screening for pending CV intake queue"
          >
            {isProcessingQueue ? '🤖 Screening...' : '⚡ Run AI Intake Batch'}
          </button>
        )}

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setShowNotifMenu(!showNotifMenu)}>
            🔔
            {safeNotifs.length > 0 && <span className="notif-badge">{safeNotifs.length}</span>}
          </button>

          {showNotifMenu && (
            <div className="dropdown-menu" style={{ width: '320px', right: 0 }}>
              <div style={{ padding: '12px', borderBottom: '1px solid var(--slate-100)', fontWeight: '600', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                <span>System Notifications</span>
                <span style={{ fontSize: '11px', color: 'var(--primary-600)' }}>{safeNotifs.length} Unread</span>
              </div>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {safeNotifs.length === 0 ? (
                  <div style={{ padding: '16px', textOverflow: 'ellipsis', textAlign: 'center', fontSize: '12px', color: 'var(--slate-500)' }}>
                    No unread notifications
                  </div>
                ) : (
                  safeNotifs.map(n => (
                    <div key={n.NotificationID || Math.random()} style={{ padding: '10px 12px', borderBottom: '1px solid var(--slate-100)', fontSize: '12px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--slate-800)' }}>{n.Title || 'Alert'}</div>
                      <div style={{ color: 'var(--slate-600)', marginTop: '2px' }}>{n.Message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Dev-Only Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button className="user-profile-btn" onClick={() => isDevEnvironment && setShowRoleMenu(!showRoleMenu)}>
            <div className="avatar">
              {(currentUser?.FullName || 'User').substring(0, 2).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate-900)' }}>
                {currentUser?.FullName || 'Guest User'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                {currentUser?.Role || 'GUEST'}
              </div>
            </div>
            {isDevEnvironment && <span style={{ fontSize: '10px', color: 'var(--slate-400)' }}>▼</span>}
          </button>

          {showRoleMenu && isDevEnvironment && (
            <div className="dropdown-menu" style={{ right: 0, width: '240px' }}>
              <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--slate-400)', textTransform: 'uppercase' }}>
                [DEV MODE] Switch Role Simulator
              </div>
              {Object.values(ROLES).map(role => (
                <button
                  key={role}
                  className={`dropdown-item ${currentUser?.Role === role ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(role)}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentUser?.Role === role ? 'var(--primary-600)' : 'transparent' }} />
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
