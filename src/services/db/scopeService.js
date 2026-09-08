// Central Data Scoping & Allow-Listed Field Sanitization Engine (Relational ID Sets & Allow-Lists)

import { ROLES, DATA_SCOPES, ROLE_DATA_SCOPES } from '../../config/constants.js';
import { localDbDriver } from './localDbDriver.js';

// Explicit Allow-Listed Field Definitions per Role for Sensitive Tables
const ALLOWED_EMPLOYEE_DIRECTORY_FIELDS = [
  'EmployeeID', 'FirstName', 'LastName', 'Email', 'Phone', 'Gender',
  'JoiningDate', 'DepartmentID', 'DesignationID', 'ManagerID',
  'EmploymentType', 'WorkLocation', 'Status'
];

const ALLOWED_CANDIDATE_PUBLIC_FIELDS = [
  'CandidateID', 'JobID', 'FullName', 'Email', 'Phone', 'Location',
  'CurrentCompany', 'CurrentDesignation', 'TotalExperience', 'RelevantExperience',
  'HighestEducation', 'Skills', 'Certifications', 'Languages',
  'ApplicationSource', 'ApplicationDate', 'AIStatus', 'AIScore',
  'AIRecommendation', 'RecruiterStatus', 'RecruiterDecision', 'AssignedRecruiter',
  'CreatedAt', 'UpdatedAt'
];

export const scopeService = {
  /**
   * Build Permitted Relational EmployeeID set for a Manager (Direct Reports + Self)
   */
  getManagerPermittedEmployeeIds(managerEmployeeId) {
    if (!managerEmployeeId) return [];
    const allEmployees = localDbDriver.getAll('Employees') || [];
    const directReports = allEmployees
      .filter(emp => String(emp.ManagerID) === String(managerEmployeeId))
      .map(emp => String(emp.EmployeeID));
    return Array.from(new Set([String(managerEmployeeId), ...directReports]));
  },

  /**
   * Build Permitted Relational JobID set for a Recruiter / Manager
   */
  getRecruiterPermittedJobIds(recruiterEmployeeId) {
    if (!recruiterEmployeeId) return [];
    const allJobs = localDbDriver.getAll('Jobs') || [];
    return allJobs
      .filter(job => String(job.RecruiterID) === String(recruiterEmployeeId) || String(job.HiringManagerID) === String(recruiterEmployeeId))
      .map(job => String(job.JobID));
  },

  /**
   * Apply Relational Record Scoping & Allow-Listed Field Sanitization for a User
   */
  applyScope(sheetName, records, currentUser) {
    if (!Array.isArray(records)) return [];
    if (!currentUser || currentUser.Status !== 'ACTIVE') return [];

    const role = currentUser.Role || ROLES.EMPLOYEE;
    const scopesMap = ROLE_DATA_SCOPES[role] || {};

    // Default scope is strictly NONE, never ALL!
    const scope = scopesMap[sheetName] || (role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN ? DATA_SCOPES.ALL : DATA_SCOPES.NONE);

    let scopedRecords = [];

    // --- 1. RECORD SCOPING LOGIC ---
    if (scope === DATA_SCOPES.ALL) {
      scopedRecords = [...records];
    } else if (scope === DATA_SCOPES.NONE) {
      scopedRecords = [];
    } else if (scope === DATA_SCOPES.SELF) {
      scopedRecords = records.filter(item => {
        if (item.EmployeeID) return String(item.EmployeeID) === String(currentUser.EmployeeID);
        if (item.CandidateID) return String(item.CandidateID) === String(currentUser.CandidateID);
        if (item.UserID) return String(item.UserID) === String(currentUser.UserID);
        return false;
      });
    } else if (scope === DATA_SCOPES.TEAM) {
      const permittedEmpIds = this.getManagerPermittedEmployeeIds(currentUser.EmployeeID);
      scopedRecords = records.filter(item => {
        if (item.EmployeeID) return permittedEmpIds.includes(String(item.EmployeeID));
        if (item.ManagerID) return String(item.ManagerID) === String(currentUser.EmployeeID);
        if (item.HiringManagerID) return String(item.HiringManagerID) === String(currentUser.EmployeeID);
        return false;
      });
    } else if (scope === DATA_SCOPES.ASSIGNED) {
      if (sheetName === 'Jobs') {
        const permittedJobIds = this.getRecruiterPermittedJobIds(currentUser.EmployeeID);
        scopedRecords = records.filter(j => permittedJobIds.includes(String(j.JobID)));
      } else if (sheetName === 'Candidates') {
        const permittedJobIds = this.getRecruiterPermittedJobIds(currentUser.EmployeeID);
        scopedRecords = records.filter(c => 
          String(c.AssignedRecruiter) === String(currentUser.EmployeeID) || 
          permittedJobIds.includes(String(c.JobID))
        );
      } else {
        scopedRecords = records.filter(item => {
          if (item.EmployeeID) return String(item.EmployeeID) === String(currentUser.EmployeeID);
          return false;
        });
      }
    }

    // --- 2. ALLOW-LISTED FIELD SANITIZATION LOGIC ---
    return scopedRecords.map(record => this.sanitizeRecord(sheetName, record, role));
  },

  /**
   * Sanitize record fields using strict Allow-Lists rather than deleting individual keys
   */
  sanitizeRecord(sheetName, record, role) {
    if (!record || typeof record !== 'object') return record;
    if (role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN || role === ROLES.HR_EXECUTIVE) {
      return { ...record }; // Full administrative access
    }

    const sanitized = {};

    if (sheetName === 'Employees') {
      const isPayrollRole = role === ROLES.PAYROLL_ADMIN;
      const allowedFields = isPayrollRole
        ? [...ALLOWED_EMPLOYEE_DIRECTORY_FIELDS, 'BaseSalary', 'BankName', 'AccountNumber', 'IFSC_Routing']
        : ALLOWED_EMPLOYEE_DIRECTORY_FIELDS;

      allowedFields.forEach(field => {
        if (record[field] !== undefined) {
          sanitized[field] = record[field];
        }
      });
      return sanitized;
    }

    if (sheetName === 'Candidates') {
      const isRecruiter = role === ROLES.RECRUITER;
      const allowedFields = isRecruiter
        ? [...ALLOWED_CANDIDATE_PUBLIC_FIELDS, 'CurrentSalary', 'ExpectedSalary', 'NoticePeriod', 'ResumeDriveFileID', 'ResumeFileName', 'ResumeText']
        : ALLOWED_CANDIDATE_PUBLIC_FIELDS;

      allowedFields.forEach(field => {
        if (record[field] !== undefined) {
          sanitized[field] = record[field];
        }
      });
      return sanitized;
    }

    // Default: Return record copy
    return { ...record };
  }
};
