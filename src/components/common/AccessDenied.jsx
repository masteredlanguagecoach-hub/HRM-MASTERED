// Protected Page Access Denied Component (Clean Unified Component Contract)

import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { Button, SVGIcon } from './UIComponents.jsx';

export function AccessDenied({ pageName, requiredPermission }) {
  const { currentUser } = useAuth();
  const { setActiveTab } = useApp();

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '450px' }}>
      <div className="state-card error-state" style={{ maxWidth: '520px', width: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <SVGIcon name="lock" size={32} color="#dc2626" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--slate-900)', marginBottom: '8px' }}>Access Restricted</h2>
        <p style={{ fontSize: '14px', color: 'var(--slate-600)', lineHeight: '1.6', marginBottom: '20px' }}>
          Your current role <strong>({currentUser?.Role?.replace('_', ' ') || 'EMPLOYEE'})</strong> is not authorized to access the <strong>{pageName}</strong> module.
        </p>

        <div style={{ background: 'var(--slate-50)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '12px', color: 'var(--slate-500)', marginBottom: '24px', textAlign: 'left' }}>
          <div><strong>Required Permission:</strong> <code>{requiredPermission}</code></div>
          <div><strong>Data Scope:</strong> Explicitly restricted to authorized roles</div>
        </div>

        <Button variant="primary" onClick={() => setActiveTab('Dashboard')} icon="dashboard">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
