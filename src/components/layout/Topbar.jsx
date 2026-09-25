import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { SVGIcon, Button } from '../common/UIComponents.jsx';
import { ROLES } from '../../config/constants.js';
import { InstallAppModal } from '../setup/InstallAppModal.jsx';

export function Topbar({ onToggleMobileSidebar }) {
  const { currentUser, switchRole, logout, hasPermission } = useAuth();
  const { activeTab, setActiveTab, searchQuery, setSearchQuery, syncStatus, notifications } = useApp();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);


  const role = currentUser?.Role || ROLES.EMPLOYEE;
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Quick Action based on role & permissions
  const renderQuickAction = () => {
    if (hasPermission('employee.create')) {
      return (
        <button className="topbar-quick-action" onClick={() => setActiveTab('Employees')} aria-label="Add New Employee">
          <SVGIcon name="plus" size={14} />
          <span>Add Employee</span>
        </button>
      );
    }
    if (hasPermission('recruitment.create')) {
      return (
        <button className="topbar-quick-action" onClick={() => setActiveTab('Recruitment')} aria-label="Post New Requisition">
          <SVGIcon name="plus" size={14} />
          <span>Post Job</span>
        </button>
      );
    }
    if (hasPermission('attendance.self.view')) {
      return (
        <button className="topbar-quick-action" onClick={() => setActiveTab('Attendance & Leave')} aria-label="Go to My Attendance">
          <SVGIcon name="attendance" size={14} />
          <span>My Attendance</span>
        </button>
      );
    }
    return null;
  };

  return (
    <header className="topbar">
      {/* LEFT REGION: Mobile drawer toggle & Active Page Title */}
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onToggleMobileSidebar} aria-label="Open navigation drawer">
          <SVGIcon name="menu" size={20} />
        </button>
        <div className="topbar-page-title">{activeTab}</div>
      </div>

      {/* CENTER REGION: Functional Search Bar */}
      <div className="topbar-center">
        <div className="topbar-search">
          <SVGIcon name="search" size={16} className="search-icon" color="var(--slate-400)" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search employees, jobs, candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Global Search"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')} aria-label="Clear search">
              <SVGIcon name="close" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* RIGHT REGION: Sync Status, Quick Action, Notifications & Accessible Account Button */}
      <div className="topbar-right">
        {/* Google Sheets Sync Badge */}
        <div className="sync-status-badge" title={syncStatus.isOnline ? 'Connected to Google Sheets Authoritative DB' : 'Operating in Local Cache Mode'}>
          <span className={`sync-dot ${syncStatus.isOnline ? 'online' : 'offline'}`}></span>
          <span className="sync-text">{syncStatus.isOnline ? 'Sheets DB Live' : 'Cache Mode'}</span>
        </div>

        {/* Quick Action Button */}
        <div className="topbar-action-wrapper">
          {renderQuickAction()}
        </div>

        {/* Install App / APK Download Button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
          onClick={() => setShowInstallModal(true)}
          title="Download & Install App (Android APK, iOS, PC, Mac)"
          aria-label="Install App"
        >
          <SVGIcon name="download" size={14} color="var(--primary-600)" />
          <span>Install App</span>
        </button>

        {/* Notifications Icon Button */}
        <div className="topbar-popover-wrapper">
          <button className="topbar-icon-btn" onClick={() => setShowNotifications(!showNotifications)} aria-label="Toggle notifications menu">
            <SVGIcon name="bell" size={18} color="var(--slate-600)" />
            {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
          </button>

          {showNotifications && (
            <div className="topbar-dropdown notifications-dropdown">
              <div className="dropdown-header">
                <strong>Notifications</strong>
                <span className="badge badge-info">{notifications.length} New</span>
              </div>
              <div className="dropdown-body">
                {notifications.length === 0 ? (
                  <div className="dropdown-empty">No unread notifications</div>
                ) : (
                  notifications.map((n, idx) => (
                    <div key={idx} className="dropdown-item">
                      <div className="item-title">{n.Title || n.Message || 'System Alert'}</div>
                      <div className="item-time">{n.CreatedAt || 'Just now'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Accessible Account Menu Button */}
        <div className="topbar-popover-wrapper">
          <button
            type="button"
            className="account-pill"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            aria-expanded={showAccountMenu}
            aria-label="User Account Menu"
          >
            <div className="account-avatar">
              {currentUser?.FullName ? currentUser.FullName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'US'}
            </div>
            <div className="account-info">
              <span className="account-name">{currentUser?.FullName || 'User'}</span>
              <span className="account-role">{role.replace(/_/g, ' ')}</span>
            </div>
          </button>

          {showAccountMenu && (
            <div className="topbar-dropdown account-dropdown" style={{ width: '280px', padding: '16px' }}>
              <div className="dropdown-user-details" style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--slate-200)' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--slate-900)' }}>{currentUser?.FullName}</div>
                <div className="user-email" style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{currentUser?.Email}</div>
                <div className="user-emp-id" style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>ID: {currentUser?.EmployeeID || 'N/A'}</div>
              </div>

              {isDev && (
                <div className="dropdown-dev-switch" style={{ marginBottom: '16px' }}>
                  <div className="dev-switch-title" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--slate-600)', marginBottom: '4px' }}>Dev Role Simulator:</div>
                  <select
                    className="dev-role-select form-select"
                    style={{ fontSize: '12px', padding: '6px' }}
                    value={role}
                    onChange={(e) => {
                      switchRole(e.target.value);
                      setShowAccountMenu(false);
                    }}
                    aria-label="Select development role"
                  >
                    <option value={ROLES.SUPER_ADMIN}>Super Admin (Eleanor)</option>
                    <option value={ROLES.EMPLOYEE}>Employee (David Kim)</option>
                  </select>
                </div>
              )}

              <Button
                variant="danger"
                size="sm"
                icon="close"
                style={{ width: '100%' }}
                onClick={() => {
                  setShowAccountMenu(false);
                  logout();
                }}
              >
                Sign Out of Workspace
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Download & Install App Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </header>
  );
}
