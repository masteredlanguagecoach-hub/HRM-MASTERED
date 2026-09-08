// Google Sheets API & Apps Script Web App Endpoint Adapter (Reconciled Driver Contract & Standardized Response Shapes)

import { localDbDriver } from './localDbDriver.js';

export const googleSheetsDriver = {
  buildHeaders(accessToken = '') {
    return accessToken ? { 'X-HRMS-Token': accessToken } : {};
  },

  /**
   * Health Check Interface (Returns boolean / Status Object)
   */
  async checkHealth(endpointUrl = '', accessToken = '') {
    const url = endpointUrl || (typeof window !== 'undefined' && window.HRMS_SCRIPT_URL) || '';
    if (!url) return false;
    try {
      const res = await this.testConnection(url, accessToken);
      return !!(res && res.success);
    } catch (e) {
      return false;
    }
  },

  /**
   * Test connection to Google Apps Script / Sheets API endpoint
   */
  async testConnection(endpointUrl, accessToken = '') {
    if (!endpointUrl) {
      return { success: false, message: 'Google Apps Script URL is empty' };
    }
    try {
      const response = await fetch(`${endpointUrl}?action=ping&token=${encodeURIComponent(accessToken)}`);
      if (response.ok) {
        const data = await response.json();
        return { success: true, message: 'Connected to Google Apps Script Web App!', data, details: data };
      }
      return { success: false, message: `HTTP Error ${response.status}: ${response.statusText}` };
    } catch (e) {
      return { success: false, message: `Connection failed: ${e.message}` };
    }
  },

  /**
   * Fetch ALL 38 Master Sheets in a single authoritative boot request (Alias: fetchAllSheets & getAllSheets)
   */
  async fetchAllSheets(endpointUrl = '', accessToken = '') {
    return this.getAllSheets(endpointUrl, accessToken);
  },

  async getAllSheets(endpointUrl = '', accessToken = '') {
    const url = endpointUrl || (typeof window !== 'undefined' && window.HRMS_SCRIPT_URL) || '';
    if (!url) return {};
    try {
      const response = await fetch(`${url}?action=readAll&token=${encodeURIComponent(accessToken)}`);
      if (!response.ok) throw new Error(`Google Sheets Authoritative Fetch Error (${response.status})`);
      const result = await response.json();
      if (result.success === false && result.status !== 'SUCCESS') {
        throw new Error(result.error || result.message || 'Failed to fetch authoritative sheets data');
      }
      return result.data || result.sheetsData || {};
    } catch (err) {
      console.warn('⚠️ Google Sheets Authoritative fetch warning:', err.message);
      return {};
    }
  },

  /**
   * Execute mutation on backend Apps Script (Alias: executeMutation)
   */
  async executeMutation(op, endpointUrl = '', accessToken = '') {
    const url = endpointUrl || (typeof window !== 'undefined' && window.HRMS_SCRIPT_URL) || '';
    if (!url) return { success: false, message: 'No remote endpoint configured' };

    try {
      if (op.action === 'INSERT') {
        const data = await this.insert(url, op.sheetName, op.data, accessToken, op.idempotencyKey);
        return { success: true, data };
      } else if (op.action === 'UPDATE') {
        const data = await this.update(url, op.sheetName, op.idField, op.idValue, op.data, accessToken, op.idempotencyKey);
        return { success: true, data };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message, message: e.message };
    }
  },

  /**
   * Fetch all records from a specific Google Sheet
   */
  async getAll(endpointUrl, sheetName, accessToken = '') {
    if (!endpointUrl) return [];
    const response = await fetch(`${endpointUrl}?action=read&sheet=${encodeURIComponent(sheetName)}&token=${encodeURIComponent(accessToken)}`);
    if (!response.ok) throw new Error(`Google Sheets API Read Error (${response.status})`);
    const result = await response.json();
    return result.data || [];
  },

  /**
   * Insert a new record into a Google Sheet
   */
  async insert(endpointUrl, sheetName, record, accessToken = '', idempotencyKey = '') {
    if (!endpointUrl) throw new Error('Google Apps Script URL is not configured.');
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8', ...this.buildHeaders(accessToken) },
      body: JSON.stringify({
        action: 'insert',
        sheet: sheetName,
        data: record,
        token: accessToken,
        idempotencyKey: idempotencyKey || ('IK-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7))
      })
    });
    if (!response.ok) throw new Error(`Google Sheets API Insert Error (${response.status})`);
    const result = await response.json();
    if (result.success === false && result.status !== 'SUCCESS') {
      throw new Error(result.error || result.message || 'Google Sheets insert failed');
    }
    return result.data;
  },

  /**
   * Update an existing record in a Google Sheet
   */
  async update(endpointUrl, sheetName, idField, idValue, updateFields, accessToken = '', idempotencyKey = '') {
    if (!endpointUrl) throw new Error('Google Apps Script URL is not configured.');
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8', ...this.buildHeaders(accessToken) },
      body: JSON.stringify({
        action: 'update',
        sheet: sheetName,
        idField,
        idValue,
        data: updateFields,
        token: accessToken,
        idempotencyKey: idempotencyKey || ('UK-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7))
      })
    });
    if (!response.ok) throw new Error(`Google Sheets API Update Error (${response.status})`);
    const result = await response.json();
    if (result.success === false && result.status !== 'SUCCESS') {
      throw new Error(result.error || result.message || 'Google Sheets update failed');
    }
    return result.data;
  },

  async uploadFile(endpointUrl, file, folderKey, metadata = {}, accessToken = '') {
    if (!endpointUrl) throw new Error('Google Apps Script URL is not configured.');
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8', ...this.buildHeaders(accessToken) },
      body: JSON.stringify({ action: 'uploadFile', token: accessToken, folderKey, metadata, file: { name: file.name, mimeType: file.type, base64 } })
    });
    const result = await response.json();
    if (!response.ok || (result.success === false && result.status !== 'SUCCESS')) {
      throw new Error(result.error || result.message || 'Google Drive upload failed');
    }
    return result.data;
  }
};
