// System Settings & AI CV Screening Configuration Page

import React, { useState } from 'react';
import { dbService } from '../services/db/dbService.js';
import { DEFAULT_SETTINGS } from '../config/defaultSettings.js';
import { scoringModel } from '../services/ai/scoringModel.js';
import { useApp } from '../context/AppContext.jsx';

export function SettingsPage() {
  const { showToast } = useApp();
  const settings = dbService.getAll('Settings');
  const getVal = key => settings.find(s => s.SettingKey === key)?.SettingValue;

  const [aiProvider, setAiProvider] = useState(getVal('ai_provider') || DEFAULT_SETTINGS.ai.provider);
  const [aiModel, setAiModel] = useState(getVal('ai_model') || DEFAULT_SETTINGS.ai.model);
  const [apiKey, setApiKey] = useState(getVal('ai_api_key') || '');
  const [appsScriptUrl, setAppsScriptUrl] = useState(getVal('apps_script_url') || '');

  const defaultWeights = DEFAULT_SETTINGS.ai.weights;
  const storedWeights = getVal('ai_weights') ? JSON.parse(getVal('ai_weights')) : defaultWeights;
  const [weights, setWeights] = useState(storedWeights);

  const totalWeights = Object.values(weights).reduce((sum, w) => sum + Number(w || 0), 0);

  const handleSaveSettings = () => {
    if (!scoringModel.validateWeights(weights)) {
      showToast(`Scoring weights must total exactly 100% (Current total: ${totalWeights}%)`, 'error');
      return;
    }

    const saveOrUpdate = (key, val, cat = 'AI') => {
      const existing = settings.find(s => s.SettingKey === key);
      if (existing) {
        dbService.update('Settings', 'SettingKey', key, { SettingValue: String(val) });
      } else {
        dbService.insert('Settings', { SettingKey: key, SettingValue: String(val), Category: cat });
      }
    };

    saveOrUpdate('ai_provider', aiProvider);
    saveOrUpdate('ai_model', aiModel);
    saveOrUpdate('ai_api_key', apiKey);
    saveOrUpdate('apps_script_url', appsScriptUrl, 'WORKSPACE');
    saveOrUpdate('ai_weights', JSON.stringify(weights));

    showToast('System & AI Screening Settings saved successfully!');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin System Settings</h1>
          <p className="page-subtitle">Configure AI CV Screening Provider, Weighted Scoring Model & Workspace Connections</p>
        </div>
        <div className="action-bar">
          <button className="btn btn-primary btn-sm" onClick={handleSaveSettings}>💾 Save All Settings</button>
        </div>
      </div>

      {/* AI Provider Configuration */}
      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--slate-900)' }}>🤖 AI CV Screening Engine Provider</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">AI Provider Abstraction</label>
            <select className="form-select" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
              <option value="Gemini">Google Gemini (Recommended)</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Custom">Custom Provider Endpoint</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Model Selection</label>
            <input className="form-input" value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="e.g. gemini-1.5-pro or gpt-4o" />
          </div>

          <div className="form-group">
            <label className="form-label">Server-Side API Key</label>
            <input className="form-input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Stored securely server-side" />
          </div>
        </div>
      </div>

      {/* 100-Point Weighted Scoring Model Configurator */}
      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--slate-900)' }}>⚖️ 100-Point CV Weighted Scoring Framework</h3>
          <span style={{ fontSize: '14px', fontWeight: '800', color: totalWeights === 100 ? 'var(--emerald-600)' : 'var(--rose-600)' }}>
            Total Weight: {totalWeights}% {totalWeights === 100 ? '✓ Valid' : '⚠️ Must equal 100%'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Object.keys(weights).map(k => (
            <div key={k} className="form-group">
              <label className="form-label" style={{ textTransform: 'capitalize' }}>{k} Weight (%)</label>
              <input
                className="form-input"
                type="number"
                value={weights[k]}
                onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Workspace Google Integration */}
      <div style={{ background: '#fff', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--slate-900)' }}>📊 Production Google Workspace API / Apps Script Connection</h3>
        <div className="form-group">
          <label className="form-label">Google Apps Script Web App Endpoint URL</label>
          <input
            className="form-input"
            value={appsScriptUrl}
            onChange={(e) => setAppsScriptUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
          />
          <span style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px', display: 'block' }}>
            When provided, all database inserts/updates automatically mirror to live Google Sheets!
          </span>
        </div>
      </div>
    </div>
  );
}
