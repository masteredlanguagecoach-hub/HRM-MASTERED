// Authoritative Master Database Service (Authoritative Sheets Sync, Scope Enforcement & Action Authorization)

import { MASTER_SHEETS } from './masterSchema.js';
import { localDbDriver } from './localDbDriver.js';
import { googleSheetsDriver } from './googleSheetsDriver.js';
import { scopeService } from './scopeService.js';
import { ROLE_PERMISSIONS, ROLES } from '../../config/constants.js';

let isRemoteConnected = false;
let isAuthoritativeBooted = false;

// Action Permission Requirements for Database Operations
const SHEET_MUTATION_PERMISSIONS = {
  Jobs: { insert: 'recruitment.create', update: 'recruitment.edit', delete: 'recruitment.edit' },
  Candidates: { insert: 'recruitment.create', update: 'recruitment.edit', delete: 'recruitment.edit' },
  Employees: { insert: 'employee.create', update: 'employee.edit', delete: 'employee.delete' },
  Attendance: { insert: 'attendance.manage', update: 'attendance.manage', delete: 'attendance.manage' },
  LeaveRequests: { insert: 'leave.apply', update: 'leave.approve', delete: 'leave.approve' },
  Payroll: { insert: 'payroll.process', update: 'payroll.process', delete: 'payroll.process' },
  PayrollItems: { insert: 'payroll.process', update: 'payroll.process', delete: 'payroll.process' },
  TrainingPrograms: { insert: 'training.manage', update: 'training.manage', delete: 'training.manage' },
  TrainingAssignments: { insert: 'training.manage', update: 'training.manage', delete: 'training.manage' },
  PerformanceGoals: { insert: 'performance.goal.create.self', update: 'performance.goal.manage.team', delete: 'performance.goal.manage.team' },
  PerformanceReviews: { insert: 'performance.review', update: 'performance.review', delete: 'performance.review' },
  ExitRequests: { insert: 'exit.self.create', update: 'exit.process', delete: 'exit.process' },
  Settings: { insert: 'settings.manage', update: 'settings.manage', delete: 'settings.manage' }
};

export const dbService = {
  /**
   * Initialize Authoritative Data Sync from Google Sheets or Fallback to Local Cache
   */
  async initAuthoritativeData() {
    try {
      localDbDriver.init();
      const isOnline = await googleSheetsDriver.checkHealth();
      if (isOnline) {
        isRemoteConnected = true;
        const remoteData = await googleSheetsDriver.fetchAllSheets();
        if (remoteData && typeof remoteData === 'object' && Object.keys(remoteData).length > 0) {
          localDbDriver.hydrateFromRemote(remoteData);
        }
        return { status: 'SUCCESS', mode: 'AUTHORITATIVE', isOnline: true };
      } else {
        isRemoteConnected = false;
        return { status: 'OFFLINE', mode: 'CACHE', isOnline: false };
      }
    } catch (err) {
      console.warn('⚠️ Google Sheets Authoritative connection offline:', err.message);
      isRemoteConnected = false;
      return { status: 'ERROR', mode: 'CACHE', isOnline: false, error: err.message };
    } finally {
      isAuthoritativeBooted = true;
    }
  },

  isOnline() {
    return isRemoteConnected;
  },

  isBooted() {
    return isAuthoritativeBooted;
  },

  /**
   * Verify whether a user is authorized for a database operation
   */
  verifyActionPermission(sheetName, actionType, currentUser) {
    if (!currentUser || currentUser.Status !== 'ACTIVE') {
      throw new Error(`Access Denied: Missing or inactive authenticated user session`);
    }
    const role = currentUser.Role || ROLES.EMPLOYEE;
    if (role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN) return true;

    const sheetPerms = SHEET_MUTATION_PERMISSIONS[sheetName];
    if (!sheetPerms) return true; // Unrestricted operational logs like Notifications / AuditLogs

    const requiredPerm = sheetPerms[actionType];
    if (!requiredPerm) return true;

    const userPerms = ROLE_PERMISSIONS[role] || [];
    if (!userPerms.includes(requiredPerm)) {
      if (sheetName === 'LeaveRequests' && actionType === 'insert' && userPerms.includes('leave.apply')) return true;
      if (sheetName === 'PerformanceGoals' && actionType === 'insert' && userPerms.includes('performance.goal.create.self')) return true;
      if (sheetName === 'ExitRequests' && actionType === 'insert' && userPerms.includes('exit.self.create')) return true;
      
      throw new Error(`Access Denied: User role ${role} lacks permission '${requiredPerm}' for ${actionType} on ${sheetName}`);
    }
    return true;
  },

  getAllRaw(sheetName) {
    localDbDriver.init();
    return localDbDriver.getAll(sheetName);
  },

  getAll(sheetName, currentUser) {
    localDbDriver.init();
    const rawData = localDbDriver.getAll(sheetName);
    if (!currentUser) return rawData; // Pre-render internal calls
    return scopeService.applyScope(sheetName, rawData, currentUser);
  },

  getById(sheetName, idField, idValue, currentUser) {
    localDbDriver.init();
    const records = localDbDriver.getAll(sheetName);
    const scoped = currentUser ? scopeService.applyScope(sheetName, records, currentUser) : records;
    return scoped.find(item => String(item[idField]) === String(idValue)) || null;
  },

  query(sheetName, predicate, currentUser) {
    localDbDriver.init();
    const records = localDbDriver.getAll(sheetName);
    const scoped = currentUser ? scopeService.applyScope(sheetName, records, currentUser) : records;
    return scoped.filter(predicate);
  },

  insert(sheetName, record, currentUser) {
    localDbDriver.init();
    if (currentUser) {
      this.verifyActionPermission(sheetName, 'insert', currentUser);
    }
    const inserted = localDbDriver.insert(sheetName, record);

    this.enqueueSyncOperation({
      action: 'INSERT',
      sheetName,
      idField: Object.keys(record)[0] || 'ID',
      idValue: record[Object.keys(record)[0]],
      data: record,
      timestamp: new Date().toISOString()
    });

    return inserted;
  },

  update(sheetName, idField, idValue, updateFields, currentUser) {
    localDbDriver.init();
    if (currentUser) {
      this.verifyActionPermission(sheetName, 'update', currentUser);
    }
    const updated = localDbDriver.update(sheetName, idField, idValue, updateFields);

    this.enqueueSyncOperation({
      action: 'UPDATE',
      sheetName,
      idField,
      idValue,
      data: updateFields,
      timestamp: new Date().toISOString()
    });

    return updated;
  },

  delete(sheetName, idField, idValue, currentUser) {
    localDbDriver.init();
    if (currentUser) {
      this.verifyActionPermission(sheetName, 'delete', currentUser);
    }
    const removed = localDbDriver.delete(sheetName, idField, idValue);

    this.enqueueSyncOperation({
      action: 'DELETE',
      sheetName,
      idField,
      idValue,
      timestamp: new Date().toISOString()
    });

    return removed;
  },

  enqueueSyncOperation(op) {
    const queue = localDbDriver.getSyncQueue();
    const idempotencyKey = `SYNC_${op.action}_${op.sheetName}_${op.idValue}_${Date.now()}`;
    queue.push({ ...op, idempotencyKey, attempts: 0, status: 'PENDING' });
    localDbDriver.saveSyncQueue(queue);
  },

  async processSyncQueue() {
    const queue = localDbDriver.getSyncQueue();
    const pending = queue.filter(q => q.status === 'PENDING');
    if (pending.length === 0) return;

    const isOnline = await googleSheetsDriver.checkHealth();
    if (!isOnline) {
      isRemoteConnected = false;
      return;
    }
    isRemoteConnected = true;

    for (const op of pending) {
      try {
        await googleSheetsDriver.executeMutation(op);
        op.status = 'SYNCED';
        op.syncedAt = new Date().toISOString();
      } catch (err) {
        op.attempts = (op.attempts || 0) + 1;
        op.lastError = err.message;
        if (op.attempts >= 5) {
          op.status = 'FAILED';
        }
      }
    }
    localDbDriver.saveSyncQueue(queue);
  },

  getSyncStatus() {
    const queue = localDbDriver.getSyncQueue();
    const pendingCount = queue.filter(q => q.status === 'PENDING').length;
    const lastSynced = queue.filter(q => q.status === 'SYNCED').pop()?.syncedAt || null;
    return {
      isOnline: isRemoteConnected,
      pendingCount,
      lastSyncedAt: lastSynced
    };
  }
};
