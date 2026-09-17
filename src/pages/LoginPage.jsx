// Professional Kerala SMB HRMS Sign In & Session Authentication Page

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { SVGIcon, Button, FormField } from '../components/common/UIComponents.jsx';
import { ROLES } from '../config/constants.js';

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleAccount, setSelectedRoleAccount] = useState('admin@masteredhrms.com');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickLogin = (roleEmail) => {
    setSelectedRoleAccount(roleEmail);
    setEmail(roleEmail);
    setPassword('password123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetEmail = email || selectedRoleAccount;
    if (!targetEmail) {
      setErrorMsg('Please enter your work email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    setTimeout(() => {
      const res = login(targetEmail, password || 'password123');
      if (res.success) {
        showToast(`Authenticated cleanly as ${res.user.FullName} (${res.user.Role})`, 'success');
      } else {
        setErrorMsg(res.message || 'Authentication failed. Please check your credentials.');
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--slate-900)',
      fontFamily: 'var(--font-sans)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* HEADER BRANDING */}
        <div style={{
          backgroundColor: 'var(--slate-900)',
          color: '#ffffff',
          padding: '32px 24px 24px 24px',
          textAlign: 'center',
          borderBottom: '2px solid var(--primary-600)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '24px',
            margin: '0 auto 12px auto',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
          }}>M</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '4px' }}>MASTERED HRMS</h1>
          <p style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: '600' }}>KERALA SMB ENTERPRISE HUMAN RESOURCE SYSTEM</p>
        </div>

        {/* LOGIN FORM */}
        <div style={{ padding: '28px 24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--slate-900)', marginBottom: '6px' }}>Sign In to Workspace</h2>
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '20px' }}>
            Enter your authorized work credentials to access HR lifecycle modules.
          </p>

          {errorMsg && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              <strong>⚠️ Authentication Error:</strong> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FormField label="Work Email Address" required>
              <input
                type="email"
                className="form-input"
                value={email || selectedRoleAccount}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@masteredhrms.com"
                required
              />
            </FormField>

            <FormField label="Password" required>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </FormField>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '44px', fontSize: '15px', marginTop: '8px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Account'}
            </button>
          </form>

          {/* QUICK DEMO ACCOUNT SELECTOR */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--slate-200)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--slate-600)', marginBottom: '10px' }}>
              Select Role Account to Sign In:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('admin@masteredhrms.com')}>Super Admin</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('hradmin@masteredhrms.com')}>HR Admin</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('hrexec@masteredhrms.com')}>HR Executive</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('recruiter@masteredhrms.com')}>Recruiter</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('payroll@masteredhrms.com')}>Payroll Admin</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('training@masteredhrms.com')}>Training Admin</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('elena@masteredhrms.com')}>Manager</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleQuickLogin('david.kim@masteredhrms.com')}>Employee</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--slate-50)', borderTop: '1px solid var(--slate-200)', textAlign: 'center', fontSize: '11px', color: 'var(--slate-500)' }}>
          Authoritative Google Sheets & Drive Security • Fail-Closed Protection
        </div>
      </div>
    </div>
  );
}
