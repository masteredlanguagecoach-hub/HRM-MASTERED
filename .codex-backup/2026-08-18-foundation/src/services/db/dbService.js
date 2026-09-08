// Unified HRMS Database Interface (Dual-Driver Router & Key Generator)

import { localDbDriver } from './localDbDriver.js';
import { googleSheetsDriver } from './googleSheetsDriver.js';
import { ID_PREFIXES } from '../../config/constants.js';

export const dbService = {
  getDriver() {
    const settings = localDbDriver.getAll('Settings');
    const appsScriptSetting = settings.find(s => s.SettingKey === 'apps_script_url');
    const appsScriptUrl = appsScriptSetting ? appsScriptSetting.SettingValue : '';

    if (appsScriptUrl && appsScriptUrl.startsWith('http')) {
      return { type: 'REMOTE', url: appsScriptUrl };
    }
    return { type: 'LOCAL', url: '' };
  },

  getAll(sheetName) {
    // For fast reactive UI execution, read from local driver (which stays synced)
    return localDbDriver.getAll(sheetName);
  },

  getById(sheetName, idField, idValue) {
    return localDbDriver.getById(sheetName, idField, idValue);
  },

  query(sheetName, predicate) {
    return localDbDriver.query(sheetName, predicate);
  },

  async insert(sheetName, record) {
    const driverConfig = this.getDriver();

    // Auto-generate ID if missing
    const prefix = this.getPrefixForSheet(sheetName);
    if (prefix) {
      const primaryKeyField = this.getPrimaryKeyField(sheetName);
      if (primaryKeyField && !record[primaryKeyField]) {
        record[primaryKeyField] = this.generateId(sheetName, prefix);
      }
    }

    // Write to local database store
    const inserted = localDbDriver.insert(sheetName, record);

    // If remote Google Sheets endpoint is connected, sync asynchronously
    if (driverConfig.type === 'REMOTE') {
      try {
        await googleSheetsDriver.insert(driverConfig.url, sheetName, record);
      } catch (e) {
        console.warn(`Remote Google Sheets sync failed for sheet ${sheetName}:`, e);
      }
    }

    return inserted;
  },

  async update(sheetName, idField, idValue, updateFields) {
    const driverConfig = this.getDriver();
    const updated = localDbDriver.update(sheetName, idField, idValue, updateFields);

    if (driverConfig.type === 'REMOTE') {
      try {
        await googleSheetsDriver.update(driverConfig.url, sheetName, idField, idValue, updateFields);
      } catch (e) {
        console.warn(`Remote Google Sheets update failed for ${sheetName}:`, e);
      }
    }

    return updated;
  },

  delete(sheetName, idField, idValue) {
    return localDbDriver.delete(sheetName, idField, idValue);
  },

  generateId(sheetName, prefix) {
    const records = localDbDriver.getAll(sheetName);
    let maxNumber = 0;

    records.forEach(item => {
      const val = String(Object.values(item)[0] || '');
      if (val.startsWith(prefix)) {
        const numPart = parseInt(val.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNumber) {
          maxNumber = numPart;
        }
      }
    });

    const nextNum = maxNumber + 1;
    return `${prefix}${String(nextNum).padStart(6, '0')}`;
  },

  getPrefixForSheet(sheetName) {
    switch (sheetName) {
      case 'Jobs': return ID_PREFIXES.JOB;
      case 'Candidates': return ID_PREFIXES.CANDIDATE;
      case 'CandidateScreenings': return ID_PREFIXES.SCREENING;
      case 'Employees': return ID_PREFIXES.EMPLOYEE;
      case 'Onboarding': return ID_PREFIXES.ONBOARDING;
      case 'Attendance': return ID_PREFIXES.ATTENDANCE;
      case 'LeaveRequests': return ID_PREFIXES.LEAVE;
      case 'Payroll': return 'PAY-';
      case 'TrainingPrograms': return ID_PREFIXES.TRAINING;
      case 'PerformanceGoals': return 'GOL-';
      case 'PerformanceReviews': return ID_PREFIXES.PERFORMANCE;
      case 'ExitRequests': return ID_PREFIXES.EXIT;
      case 'Notifications': return ID_PREFIXES.NOTIFICATION;
      default: return null;
    }
  },

  getPrimaryKeyField(sheetName) {
    const schema = localDbDriver.getAll(sheetName);
    // Standard convention: First column name in schema
    return sheetName.slice(0, -1) + 'ID';
  }
};
