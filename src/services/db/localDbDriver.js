// Local In-Memory & LocalStorage Database Driver with Versioned Non-Destructive Migration

import { MASTER_SHEETS } from './masterSchema.js';
import { DEFAULT_SETTINGS } from '../../config/defaultSettings.js';

const STORAGE_KEY_PREFIX = 'HRMS_DB_';
const SYNC_QUEUE_KEY = 'HRMS_SYNC_QUEUE';
const DB_VERSION_KEY = 'HRMS_DB_VERSION';
const CURRENT_DB_VERSION = '3.0';

function createInitialData() {
  const data = {};
  
  Object.keys(MASTER_SHEETS).forEach(sheetName => {
    data[sheetName] = [];
  });

  // Settings
  data.Settings = [
    { SettingKey: 'company_name', SettingValue: DEFAULT_SETTINGS.company.name, Category: 'Company', UpdatedAt: new Date().toISOString(), UpdatedBy: 'SUPER_ADMIN' },
    { SettingKey: 'ai_provider', SettingValue: DEFAULT_SETTINGS.ai.provider, Category: 'AI', UpdatedAt: new Date().toISOString(), UpdatedBy: 'SUPER_ADMIN' },
    { SettingKey: 'ai_model', SettingValue: DEFAULT_SETTINGS.ai.model, Category: 'AI', UpdatedAt: new Date().toISOString(), UpdatedBy: 'SUPER_ADMIN' },
    { SettingKey: 'ai_weights', SettingValue: JSON.stringify(DEFAULT_SETTINGS.ai.weights), Category: 'AI', UpdatedAt: new Date().toISOString(), UpdatedBy: 'SUPER_ADMIN' },
    { SettingKey: 'ai_thresholds', SettingValue: JSON.stringify(DEFAULT_SETTINGS.ai.thresholds), Category: 'AI', UpdatedAt: new Date().toISOString(), UpdatedBy: 'SUPER_ADMIN' }
  ];

  // Users (Only Super Admin and Employee accounts)
  data.Users = [
    { UserID: 'USR-000001', FullName: 'Eleanor Vance (Super Admin)', Email: 'admin@masteredhrms.com', Role: 'SUPER_ADMIN', DepartmentID: 'DEP-000002', EmployeeID: 'EMP-000001', Status: 'ACTIVE', CreatedAt: '2026-01-10', LastLogin: new Date().toISOString() },
    { UserID: 'USR-000005', FullName: 'David Kim (Employee)', Email: 'david.kim@masteredhrms.com', Role: 'EMPLOYEE', DepartmentID: 'DEP-000001', EmployeeID: 'EMP-000005', Status: 'ACTIVE', CreatedAt: '2026-03-01', LastLogin: new Date().toISOString() }
  ];

  // Departments
  data.Departments = [
    { DepartmentID: 'DEP-000001', DepartmentName: 'Engineering & Technology', Code: 'ENG', HeadEmployeeID: 'EMP-000002', Status: 'ACTIVE', CreatedAt: '2026-01-01' },
    { DepartmentID: 'DEP-000002', DepartmentName: 'Human Resources & Talent', Code: 'HR', HeadEmployeeID: 'EMP-000001', Status: 'ACTIVE', CreatedAt: '2026-01-01' },
    { DepartmentID: 'DEP-000003', DepartmentName: 'Product & Design', Code: 'PRD', HeadEmployeeID: 'EMP-000005', Status: 'ACTIVE', CreatedAt: '2026-01-01' },
    { DepartmentID: 'DEP-000004', DepartmentName: 'Finance & Operations', Code: 'FIN', HeadEmployeeID: 'EMP-000004', Status: 'ACTIVE', CreatedAt: '2026-01-01' }
  ];

  // Designations
  data.Designations = [
    { DesignationID: 'DSG-000001', DesignationTitle: 'Senior Full Stack AI Engineer', DepartmentID: 'DEP-000001', Level: 'L5', Status: 'ACTIVE', CreatedAt: '2026-01-01' },
    { DesignationID: 'DSG-000002', DesignationTitle: 'Lead Talent Acquisition Manager', DepartmentID: 'DEP-000002', Level: 'L4', Status: 'ACTIVE', CreatedAt: '2026-01-01' },
    { DesignationID: 'DSG-000003', DesignationTitle: 'Engineering Manager', DepartmentID: 'DEP-000001', Level: 'L6', Status: 'ACTIVE', CreatedAt: '2026-01-01' },
    { DesignationID: 'DSG-000004', DesignationTitle: 'Payroll & HR Specialist', DepartmentID: 'DEP-000004', Level: 'L3', Status: 'ACTIVE', CreatedAt: '2026-01-01' },
    { DesignationID: 'DSG-000005', DesignationTitle: 'Full Stack Developer', DepartmentID: 'DEP-000001', Level: 'L3', Status: 'ACTIVE', CreatedAt: '2026-01-01' }
  ];

  // Employees
  data.Employees = [
    { EmployeeID: 'EMP-000001', FirstName: 'Eleanor', LastName: 'Vance', Email: 'admin@masteredhrms.com', Phone: '+1 (555) 019-2831', Gender: 'Female', DateOfBirth: '1988-04-12', JoiningDate: '2022-01-15', DepartmentID: 'DEP-000002', DesignationID: 'DSG-000002', ManagerID: 'N/A', EmploymentType: 'FULL_TIME', WorkLocation: 'San Francisco, CA', Status: 'ACTIVE', BaseSalary: 165000, BankName: 'Silicon Valley Bank', AccountNumber: '****9812', IFSC_Routing: '121000358', CreatedAt: '2026-01-10' },
    { EmployeeID: 'EMP-000005', FirstName: 'David', LastName: 'Kim', Email: 'david.kim@masteredhrms.com', Phone: '+1 (555) 018-9923', Gender: 'Male', DateOfBirth: '1993-09-24', JoiningDate: '2024-03-01', DepartmentID: 'DEP-000001', DesignationID: 'DSG-000005', ManagerID: 'EMP-000001', EmploymentType: 'FULL_TIME', WorkLocation: 'Austin, TX', Status: 'ACTIVE', BaseSalary: 110000, BankName: 'Chase Bank', AccountNumber: '****4412', IFSC_Routing: '111000025', CreatedAt: '2026-03-01' }
  ];

  // HR Standard Operating Procedures (SOPs)
  data.HRSOPs = [
    { SOPID: 'SOP-001', SOPTitle: 'End-to-End Recruitment & CV Screening Policy', Category: 'RECRUITMENT', Version: 'v2.1', EffectiveDate: '2026-01-01', Summary: 'Guidelines for candidate intake, AI-assisted CV analysis, and mandatory human recruiter interview evaluation.', ApprovedBy: 'SUPER_ADMIN', Status: 'ACTIVE' },
    { SOPID: 'SOP-002', SOPTitle: '5-Step Employee Onboarding & Asset Checklist', Category: 'ONBOARDING', Version: 'v1.5', EffectiveDate: '2026-01-01', Summary: 'Standard workflow for offer acceptance, document verification, asset provisioning, and employee activation.', ApprovedBy: 'SUPER_ADMIN', Status: 'ACTIVE' },
    { SOPID: 'SOP-003', SOPTitle: 'Daily Attendance Marking & Regularization SOP', Category: 'ATTENDANCE', Version: 'v2.0', EffectiveDate: '2026-01-01', Summary: 'Rules for daily check-in/out, admin attendance overrides, regularization requests, and monthly locking.', ApprovedBy: 'SUPER_ADMIN', Status: 'ACTIVE' },
    { SOPID: 'SOP-004', SOPTitle: 'Payroll Processing & Statutory Compliance SOP', Category: 'PAYROLL', Version: 'v3.0', EffectiveDate: '2026-01-01', Summary: 'Procedure for monthly gross salary calculations, statutory deductions (PF, ESI, TDS, LWF), and bank exports.', ApprovedBy: 'SUPER_ADMIN', Status: 'ACTIVE' },
    { SOPID: 'SOP-005', SOPTitle: 'KPI & KRA Performance Review Standard', Category: 'PERFORMANCE', Version: 'v1.8', EffectiveDate: '2026-01-01', Summary: 'Framework for establishing quarterly Key Result Areas (KRAs) and measurable Key Performance Indicators (KPIs).', ApprovedBy: 'SUPER_ADMIN', Status: 'ACTIVE' }
  ];

  // Performance Goals (KPIs & KRAs)
  data.PerformanceGoals = [
    { GoalID: 'GOAL-001', EmployeeID: 'EMP-000005', ReviewPeriod: '2026-Q3', GoalTitle: 'Full-Stack Architecture Modernization', KPI_KRA: 'KRA: Platform Engineering', TargetMetric: 'Achieve 99.9% API uptime & sub-200ms latency', DueDate: '2026-09-30', ProgressPercent: 85, Status: 'IN_PROGRESS' },
    { GoalID: 'GOAL-002', EmployeeID: 'EMP-000005', ReviewPeriod: '2026-Q3', GoalTitle: 'Automated Test Code Coverage', KPI_KRA: 'KPI: Quality Assurance', TargetMetric: 'Maintain > 90% unit & integration test coverage', DueDate: '2026-09-30', ProgressPercent: 95, Status: 'COMPLETED' }
  ];

  return data;
}

class LocalDbDriver {
  constructor() {
    this.memoryData = null;
    this.syncQueue = [];
    this.init();
  }

  init() {
    try {
      const storedVersion = typeof window !== 'undefined' ? localStorage.getItem(DB_VERSION_KEY) : null;
      if (storedVersion !== CURRENT_DB_VERSION) {
        this.memoryData = createInitialData();
        this.saveAllToStorage();
        if (typeof window !== 'undefined') localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
        return;
      }

      const loadedData = {};
      let hasMissingSheet = false;

      Object.keys(MASTER_SHEETS).forEach(sheetName => {
        const key = STORAGE_KEY_PREFIX + sheetName;
        const json = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        if (json) {
          try {
            loadedData[sheetName] = JSON.parse(json);
          } catch (e) {
            loadedData[sheetName] = [];
          }
        } else {
          hasMissingSheet = true;
        }
      });

      if (hasMissingSheet || !loadedData.Users || loadedData.Users.length === 0) {
        this.memoryData = createInitialData();
        this.saveAllToStorage();
        if (typeof window !== 'undefined') localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
      } else {
        this.memoryData = loadedData;
      }

      const rawQueue = typeof window !== 'undefined' ? localStorage.getItem(SYNC_QUEUE_KEY) : null;
      if (rawQueue) {
        try {
          this.syncQueue = JSON.parse(rawQueue);
        } catch (e) {
          this.syncQueue = [];
        }
      }
    } catch (e) {
      console.warn('LocalDbDriver init fallback to fresh initial data:', e);
      this.memoryData = createInitialData();
    }
  }

  saveAllToStorage() {
    if (typeof window === 'undefined' || !this.memoryData) return;
    Object.keys(this.memoryData).forEach(sheetName => {
      localStorage.setItem(STORAGE_KEY_PREFIX + sheetName, JSON.stringify(this.memoryData[sheetName]));
    });
  }

  getAll(sheetName) {
    if (!this.memoryData || !this.memoryData[sheetName]) return [];
    return this.memoryData[sheetName];
  }

  insert(sheetName, record) {
    if (!this.memoryData[sheetName]) this.memoryData[sheetName] = [];
    this.memoryData[sheetName].push(record);
    this.saveAllToStorage();
    return record;
  }

  update(sheetName, primaryKeyField, primaryKeyValue, updatedFields) {
    if (!this.memoryData[sheetName]) return null;
    const idx = this.memoryData[sheetName].findIndex(r => r[primaryKeyField] === primaryKeyValue);
    if (idx !== -1) {
      this.memoryData[sheetName][idx] = { ...this.memoryData[sheetName][idx], ...updatedFields };
      this.saveAllToStorage();
      return this.memoryData[sheetName][idx];
    }
    return null;
  }

  delete(sheetName, primaryKeyField, primaryKeyValue) {
    if (!this.memoryData[sheetName]) return false;
    const initialLen = this.memoryData[sheetName].length;
    this.memoryData[sheetName] = this.memoryData[sheetName].filter(r => r[primaryKeyField] !== primaryKeyValue);
    this.saveAllToStorage();
    return this.memoryData[sheetName].length < initialLen;
  }

  hydrateFromRemote(remoteData) {
    if (!remoteData || typeof remoteData !== 'object') return;
    Object.keys(remoteData).forEach(sheetName => {
      if (Array.isArray(remoteData[sheetName])) {
        this.memoryData[sheetName] = remoteData[sheetName];
      }
    });
    this.saveAllToStorage();
  }

  getSyncQueue() {
    return Array.isArray(this.syncQueue) ? this.syncQueue : [];
  }

  saveSyncQueue(queue) {
    this.syncQueue = queue;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
  }
}

export const localDbDriver = new LocalDbDriver();
