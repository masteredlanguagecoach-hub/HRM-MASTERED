// Google Sheets API & Apps Script Web App Endpoint Adapter

export const googleSheetsDriver = {
  /**
   * Test connection to Google Apps Script / Sheets API endpoint
   */
  async testConnection(endpointUrl) {
    if (!endpointUrl) {
      return { success: false, message: 'Google Apps Script URL is empty' };
    }
    try {
      const response = await fetch(`${endpointUrl}?action=ping`, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, message: 'Connected to Google Apps Script Web App!', details: data };
      }
      return { success: false, message: `HTTP Error ${response.status}: ${response.statusText}` };
    } catch (e) {
      return { success: false, message: `Connection failed: ${e.message}` };
    }
  },

  /**
   * Fetch all records from a specific Google Sheet
   */
  async getAll(endpointUrl, sheetName) {
    if (!endpointUrl) throw new Error('Google Apps Script URL is not configured.');
    const response = await fetch(`${endpointUrl}?action=read&sheet=${encodeURIComponent(sheetName)}`);
    if (!response.ok) throw new Error(`Google Sheets API Read Error (${response.status})`);
    const result = await response.json();
    return result.data || [];
  },

  /**
   * Insert a new record into a Google Sheet
   */
  async insert(endpointUrl, sheetName, record) {
    if (!endpointUrl) throw new Error('Google Apps Script URL is not configured.');
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'insert',
        sheet: sheetName,
        data: record
      })
    });
    if (!response.ok) throw new Error(`Google Sheets API Insert Error (${response.status})`);
    const result = await response.json();
    return result.data;
  },

  /**
   * Update an existing record in a Google Sheet
   */
  async update(endpointUrl, sheetName, idField, idValue, updateFields) {
    if (!endpointUrl) throw new Error('Google Apps Script URL is not configured.');
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        sheet: sheetName,
        idField,
        idValue,
        data: updateFields
      })
    });
    if (!response.ok) throw new Error(`Google Sheets API Update Error (${response.status})`);
    const result = await response.json();
    return result.data;
  }
};
