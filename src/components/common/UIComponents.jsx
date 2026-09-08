// Mastered HRMS Complete Stitch Design System Component Library

import React, { useState, useEffect } from 'react';
import { formatEnumLabel } from '../../config/constants.js';

// --- SVG ICON SYSTEM ---
export function SVGIcon({ name, size = 18, color = 'currentColor', className = '' }) {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
    recruitment: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>,
    onboarding: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>,
    employees: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
    attendance: <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/>,
    payroll: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>,
    training: <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>,
    performance: <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>,
    exit: <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>,
    reports: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>,
    settings: <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6-3.6z"/>,
    health: <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-2.5l-1.5-4.5L11.5 16 10 10.5 8.5 14H6v-2h1.5l1.5-4.5L11.5 14 13 8.5l1.5 5.5H18v2z"/>,
    search: <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>,
    bell: <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>,
    user: <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>,
    menu: <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>,
    chevronLeft: <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>,
    chevronRight: <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>,
    lock: <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>,
    sync: <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>,
    plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>,
    close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>,
    folder: <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>,
    edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>,
    trash: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>,
    filter: <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
  };

  const svgPath = icons[name] || icons.dashboard;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`svg-icon ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      {svgPath}
    </svg>
  );
}

// --- BREADCRUMBS COMPONENT ---
export function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <nav className="breadcrumbs-nav" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <span key={idx} className="breadcrumb-item">
          {idx > 0 && <span className="breadcrumb-separator">/</span>}
          <span className={`breadcrumb-label ${idx === items.length - 1 ? 'active' : ''}`}>{item}</span>
        </span>
      ))}
    </nav>
  );
}

// --- PAGE HEADER COMPONENT ---
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="page-header">
      <div>
        {breadcrumb && <Breadcrumbs items={breadcrumb} />}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

// --- BUTTON & ICON BUTTON COMPONENT ---
export function Button({ variant = 'primary', size = 'md', children, icon, onClick, disabled = false, type = 'button', className = '', ariaLabel }) {
  const btnClass = `btn btn-${variant} btn-${size} ${className}`;
  return (
    <button type={type} className={btnClass} onClick={onClick} disabled={disabled} aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}>
      {icon && <SVGIcon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function IconButton({ icon, onClick, title, ariaLabel, variant = 'ghost', size = 'md', className = '' }) {
  return (
    <button
      type="button"
      className={`btn-icon btn-icon-${variant} btn-icon-${size} ${className}`}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
    >
      <SVGIcon name={icon} size={size === 'sm' ? 14 : 18} />
    </button>
  );
}

// --- STAT CARD COMPONENT ---
export function StatCard({ title, value, subtitle, iconName, trend, iconBg = 'var(--primary-50)', iconColor = 'var(--primary-600)' }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className="stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
          <SVGIcon name={iconName} size={20} color={iconColor} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-sub">{subtitle}</div>}
      {trend && <div className={`stat-trend stat-trend-${trend.type}`}>{trend.label}</div>}
    </div>
  );
}

// --- CONTENT CARD COMPONENT ---
export function ContentCard({ title, subtitle, actions, children, className = '' }) {
  return (
    <div className={`content-card ${className}`}>
      {(title || actions) && (
        <div className="content-card-header">
          <div>
            {title && <h3 className="content-card-title">{title}</h3>}
            {subtitle && <p className="content-card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="content-card-actions">{actions}</div>}
        </div>
      )}
      <div className="content-card-body">{children}</div>
    </div>
  );
}

// --- STATUS BADGE COMPONENT (HUMAN-READABLE ENUM FORMATTER) ---
export function StatusBadge({ status, type }) {
  const label = formatEnumLabel(status);

  // Auto-resolve badge type if not explicitly passed
  let resolvedType = type;
  if (!resolvedType) {
    const s = String(status).toUpperCase();
    if (s.includes('ACTIVE') || s.includes('APPROVED') || s.includes('PAID') || s.includes('COMPLETED') || s.includes('PRESENT') || s.includes('STRONG_SHORTLIST') || s.includes('SELECTED')) {
      resolvedType = 'success';
    } else if (s.includes('PENDING') || s.includes('REVIEW') || s.includes('PROCESSING') || s.includes('SHORTLIST') || s.includes('INTERVIEW') || s.includes('LATE') || s.includes('WORK_FROM_HOME')) {
      resolvedType = 'warning';
    } else if (s.includes('REJECTED') || s.includes('FAILED') || s.includes('CANCELLED') || s.includes('ABSENT') || s.includes('LOW_MATCH')) {
      resolvedType = 'danger';
    } else {
      resolvedType = 'info';
    }
  }

  return <span className={`status-badge badge-${resolvedType}`}>{label}</span>;
}

// --- TABLE TOOLBAR COMPONENT ---
export function TableToolbar({ searchValue, onSearchChange, placeholder = 'Search table...', filters, actions }) {
  return (
    <div className="table-toolbar">
      <div className="toolbar-search">
        <SVGIcon name="search" size={16} color="var(--slate-400)" />
        <input
          type="text"
          className="toolbar-search-input"
          placeholder={placeholder}
          value={searchValue || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
        />
        {searchValue && (
          <button className="search-clear-btn" onClick={() => onSearchChange && onSearchChange('')}>
            <SVGIcon name="close" size={14} />
          </button>
        )}
      </div>

      <div className="toolbar-controls">
        {filters}
        {actions}
      </div>
    </div>
  );
}

// --- DATA TABLE COMPONENT ---
export function DataTable({ columns, data, emptyMessage = 'No records found', onRowClick }) {
  if (!data || data.length === 0) {
    return <EmptyState title="No Records" description={emptyMessage} />;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{ textAlign: col.align || 'left', width: col.width || 'auto' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} onClick={() => onRowClick && onRowClick(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-footer-bar">
        <span>Showing {data.length} records</span>
      </div>
    </div>
  );
}

// --- FORM FIELD COMPONENT ---
export function FormField({ label, error, required, children, helpText }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label} {required && <span className="form-required">*</span>}
        </label>
      )}
      {children}
      {helpText && <div className="form-help">{helpText}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

// --- TABS COMPONENT ---
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs-header">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <SVGIcon name={t.icon} size={16} />}
          <span>{t.label}</span>
          {t.count !== undefined && <span className="tab-count-badge">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// --- MODAL COMPONENT WITH FOCUS TRAP & ESCAPE LISTENER ---
export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '600px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <IconButton icon="close" onClick={onClose} ariaLabel="Close dialog" />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// --- CONFIRMATION DIALOG (REPLACES NATIVE PROMPT / CONFIRM / ALERT) ---
export function ConfirmationDialog({ isOpen, onClose, onConfirm, title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', confirmVariant = 'primary' }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="480px" footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={confirmVariant} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
      </div>
    }>
      <p style={{ fontSize: '14px', color: 'var(--slate-600)', lineHeight: '1.6' }}>{message}</p>
    </Modal>
  );
}

// --- KANBAN BOARD & CANDIDATE CARD COMPONENTS ---
export function KanbanBoard({ columns, children }) {
  return <div className="kanban-board">{children}</div>;
}

export function KanbanColumn({ title, count, children, badgeColor = 'var(--primary-600)' }) {
  return (
    <div className="kanban-column">
      <div className="column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="column-dot" style={{ backgroundColor: badgeColor }}></span>
          <h4 className="column-title">{title}</h4>
        </div>
        <span className="column-count">{count}</span>
      </div>
      <div className="column-body">{children}</div>
    </div>
  );
}

export function CandidateCard({ candidate, onClick, onAction }) {
  return (
    <div className="candidate-card" onClick={() => onClick && onClick(candidate)}>
      <div className="card-top">
        <span className="candidate-name">{candidate.FullName}</span>
        <StatusBadge status={candidate.AIRecommendation || 'PENDING'} />
      </div>
      <div className="candidate-pos">{candidate.JobID}</div>
      <div className="candidate-meta">
        <span>Experience: {candidate.TotalExperience} Yrs</span>
        <span>AI Score: <strong>{candidate.AIScore || 0}%</strong></span>
      </div>
      {onAction && (
        <div className="card-actions-strip" onClick={e => e.stopPropagation()}>
          <button className="card-action-btn" onClick={() => onAction(candidate, 'SHORTLIST')}>Shortlist</button>
          <button className="card-action-btn action-danger" onClick={() => onAction(candidate, 'REJECT')}>Reject</button>
        </div>
      )}
    </div>
  );
}

// --- EMPTY STATE COMPONENT (NO EMOJI) ---
export function EmptyState({ title = 'No Data Available', description = 'There are no items to display at this time.', action }) {
  return (
    <div className="state-card empty-state">
      <div className="state-icon-container">
        <SVGIcon name="folder" size={32} color="var(--slate-400)" />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{description}</p>
      {action && <div className="state-action">{action}</div>}
    </div>
  );
}

// --- LOADING SKELETON COMPONENT ---
export function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-row"></div>
      ))}
    </div>
  );
}

export function LoadingState({ message = 'Loading Mastered HRMS Workspace...' }) {
  return (
    <div className="state-card loading-state">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

// --- ERROR STATE COMPONENT ---
export function ErrorState({ title = 'System Error', message = 'An error occurred while loading data.', onRetry }) {
  return (
    <div className="state-card error-state">
      <div className="state-icon-container warning">
        <SVGIcon name="health" size={32} color="#dc2626" />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} icon="sync">
          Retry
        </Button>
      )}
    </div>
  );
}
