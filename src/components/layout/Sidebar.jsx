// Application Desktop Sidebar Navigation Component (SVG Icons, Collapsible Mode & Keyboard Accessibility)

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { PAGE_PERMISSION_MAP, ROLE_NAV_LABELS, ROLES } from '../../config/constants.js';
import { SVGIcon } from '../common/UIComponents.jsx';

export function Sidebar() {
  const { activeTab, setActiveTab } = useApp();
  const { currentUser, hasAnyPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = currentUser?.Role || ROLES.EMPLOYEE;
  const customLabels = ROLE_NAV_LABELS[role] || {};

  const navItems = [
    { id: 'Dashboard', label: customLabels['Dashboard'] || 'Dashboard', icon: 'dashboard' },
    { id: 'Recruitment', label: customLabels['Recruitment'] || 'Recruitment', icon: 'recruitment' },
    { id: 'Onboarding', label: customLabels['Onboarding'] || 'Onboarding', icon: 'onboarding' },
    { id: 'Employees', label: customLabels['Employees'] || 'Employees', icon: 'employees' },
    { id: 'Attendance & Leave', label: customLabels['Attendance & Leave'] || 'Attendance & Leave', icon: 'attendance' },
    { id: 'Payroll', label: customLabels['Payroll'] || 'Payroll', icon: 'payroll' },
    { id: 'Training', label: customLabels['Training'] || 'Training', icon: 'training' },
    { id: 'Performance', label: customLabels['Performance'] || 'Performance', icon: 'performance' },
    { id: 'Exit Management', label: customLabels['Exit Management'] || 'Exit Management', icon: 'exit' },
    { id: 'Reports', label: customLabels['Reports'] || 'Reports', icon: 'reports' },
    { id: 'Settings', label: customLabels['Settings'] || 'Settings', icon: 'settings' },
    { id: 'System Health', label: customLabels['System Health'] || 'System Health', icon: 'health' }
  ];

  const visibleItems = navItems.filter(item => {
    const requiredPermissions = PAGE_PERMISSION_MAP[item.id];
    return hasAnyPermission(requiredPermissions);
  });

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="brand-group">
          <div className="brand-badge">M</div>
          {!isCollapsed && (
            <div className="brand-details">
              <span className="brand-name">MASTERED HRMS</span>
              <span className="brand-sub">ENTERPRISE PLATFORM</span>
            </div>
          )}
        </div>
        <button
          className="collapse-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <SVGIcon name={isCollapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
        </button>
      </div>

      {/* Navigation Links - Single Vertical Scroll Region */}
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <button
            key={item.id}
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ''}
          >
            <SVGIcon name={item.icon} size={18} />
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="security-badge">
            <SVGIcon name="lock" size={14} color="#38bdf8" />
            <span>RBAC Protected Security v2.5</span>
          </div>
        </div>
      )}
    </aside>
  );
}
