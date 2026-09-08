// System Settings Module Page (Google Apps Script / Drive Secrets, Setup Wizard & Template Manager)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { googleSheetsDriver } from '../services/db/googleSheetsDriver.js';
import { PageHeader, ContentCard, FormField, Button, StatusBadge } from '../components/common/UIComponents.jsx';
import { SetupWizardModal } from '../components/setup/SetupWizardModal.jsx';
import { TemplateManagerModal } from '../components/documents/TemplateManagerModal.jsx';

export function SettingsPage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  const [config, setConfig] = useState({
    companyName: 'Mastered HRMS Inc',
    scriptUrl: typeof window !== 'undefined' && window.HRMS_SCRIPT_URL ? window.HRMS_SCRIPT_URL : 'https://script.google.com/macros/s/AKfycb.../exec',
    apiSecretToken: 'HRMS_MASTER_SECRET_2026',
    aiProvider: 'Gemini',
    aiModel: 'gemini-1.5-pro'
  });

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await googleSheetsDriver.testConnection(config.scriptUrl, config.apiSecretToken);
      setTestResult(res);
      if (res.success) {
        showToast('Google Apps Script endpoint connected cleanly!', 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (e) {
      setTestResult({ success: false, message: e.message });
      showToast(e.message, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    try {
      dbService.update('Settings', 'SettingKey', 'company_name', { SettingValue: config.companyName }, currentUser);
      showToast('System configuration saved successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="module-view">
      <PageHeader
        title="System Configuration & Administrative Control"
        subtitle="Google Workspace Apps Script, Drive Storage Architecture & Super Admin Setup Wizard"
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" icon="folder" onClick={() => setIsTemplateManagerOpen(true)}>
              Document Template Manager
            </Button>
            <Button variant="primary" icon="settings" onClick={() => setIsSetupWizardOpen(true)}>
              Super Admin Setup Wizard
            </Button>
          </div>
        }
      />

      <div className="dashboard-grid-2">
        <ContentCard title="Google Apps Script & Drive Integration">
          <form onSubmit={handleSaveSettings}>
            <FormField label="Organization Name" required>
              <input type="text" className="form-input" value={config.companyName} onChange={e => setConfig({ ...config, companyName: e.target.value })} required />
            </FormField>

            <FormField label="Google Apps Script Web App Endpoint URL" required helpText="URL of deployed Apps Script handling authoritative Google Sheets API sync">
              <input type="text" className="form-input" value={config.scriptUrl} onChange={e => setConfig({ ...config, scriptUrl: e.target.value })} required />
            </FormField>

            <FormField label="API Secret Token" required helpText="Token remains masked for security">
              <input type="password" className="form-input" value={config.apiSecretToken} onChange={e => setConfig({ ...config, apiSecretToken: e.target.value })} required />
            </FormField>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <Button variant="secondary" icon="sync" onClick={handleTestConnection} disabled={isTesting}>
                {isTesting ? 'Testing Connection...' : 'Test Endpoint Connection'}
              </Button>
              {hasPermission('settings.manage') && (
                <Button type="submit" variant="primary" icon="settings">Save Configuration</Button>
              )}
            </div>

            {testResult && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: testResult.success ? '#dcfce7' : '#fee2e2', border: `1px solid ${testResult.success ? '#86efac' : '#fca5a5'}` }}>
                <div style={{ fontWeight: '700', color: testResult.success ? '#15803d' : '#b91c1c' }}>
                  {testResult.success ? '✓ Connection Verified' : '⚠️ Connection Failed'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate-700)', marginTop: '4px' }}>{testResult.message}</div>
              </div>
            )}
          </form>
        </ContentCard>

        <ContentCard title="AI Provider & Model Engine Selection">
          <FormField label="AI Screening Provider">
            <select className="form-select" value={config.aiProvider} onChange={e => setConfig({ ...config, aiProvider: e.target.value })}>
              <option value="Gemini">Google Gemini AI Engine (Recommended)</option>
              <option value="OpenAI">OpenAI GPT-4 Engine</option>
            </select>
          </FormField>

          <FormField label="Active Model Name">
            <input type="text" className="form-input" value={config.aiModel} onChange={e => setConfig({ ...config, aiModel: e.target.value })} />
          </FormField>

          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--slate-800)', marginBottom: '4px' }}>AI Decision Safeguard Policy</div>
            <p style={{ fontSize: '12px', color: 'var(--slate-600)', lineHeight: '1.5' }}>
              AI models provide scores and explanations for recruiter decision support. AI never executes final hiring or rejection decisions; authorized human recruiter sign-off is enforced on all candidates.
            </p>
          </div>
        </ContentCard>
      </div>

      {/* Super Admin Setup Wizard Modal */}
      {isSetupWizardOpen && (
        <SetupWizardModal
          isOpen={isSetupWizardOpen}
          onClose={() => setIsSetupWizardOpen(false)}
        />
      )}

      {/* Template Manager Modal */}
      {isTemplateManagerOpen && (
        <TemplateManagerModal
          isOpen={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
        />
      )}
    </div>
  );
}
