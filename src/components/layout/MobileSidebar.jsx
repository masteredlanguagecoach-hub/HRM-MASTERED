// Application Mobile Sidebar Navigation Drawer Component (Accessible Button Semantics)

import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { PAGE_PERMISSION_MAP, ROLE_NAV_LABELS, ROLES } from '../../config/constants.js';
import { SVGIcon } from '../common/UIComponents.jsx';

export function MobileSidebar({ isOpen, onClose }) {
  const { activeTab, setActiveTab } = useApp();
  const { currentUser, hasAnyPermission } = useAuth();

  if (!isOpen) return null;

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
    <div className="mobile-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mobile-drawer-content" onClick={e => e.stopPropagation()}>
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-badge">M</div>
            <span className="brand-name">MASTERED HRMS</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close navigation menu">
            <SVGIcon name="close" size={18} />
          </button>
        </div>

        <nav className="mobile-drawer-nav">
          {visibleItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={`drawer-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
            >
              <SVGIcon name={item.icon} size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
