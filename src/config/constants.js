// System-wide Constants, Enums, Roles, Permissions, Scopes, and Navigation Registry

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  EMPLOYEE: 'EMPLOYEE'
};

export const DATA_SCOPES = {
  ALL: 'ALL',
  DEPARTMENT: 'DEPARTMENT',
  TEAM: 'TEAM',
  ASSIGNED: 'ASSIGNED',
  SELF: 'SELF',
  NONE: 'NONE'
};

export const PERMISSIONS = {
  // Navigation / Views
  DASHBOARD_VIEW: 'dashboard.view',
  RECRUITMENT_VIEW: 'recruitment.view',
  ONBOARDING_VIEW: 'onboarding.view',
  EMPLOYEE_VIEW: 'employee.view',
  EMPLOYEE_DIRECTORY_VIEW: 'employee.directory.view',
  EMPLOYEE_SENSITIVE_VIEW: 'employee.sensitive.view',
  EMPLOYEE_SELF_VIEW: 'employee.self.view',
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_SELF_VIEW: 'attendance.self.view',
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_SELF_VIEW: 'payroll.self.view',
  PAYSLIP_SELF_DOWNLOAD: 'payslip.self.download',
  TRAINING_VIEW: 'training.view',
  TRAINING_SELF_VIEW: 'training.self.view',
  PERFORMANCE_VIEW: 'performance.view',
  PERFORMANCE_SELF_VIEW: 'performance.self.view',
  EXIT_VIEW: 'exit.view',
  EXIT_SELF_CREATE: 'exit.self.create',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_VIEW: 'settings.view',
  HEALTH_VIEW: 'health.view',
  AUDIT_VIEW: 'audit.view',

  // Management / Actions
  RECRUITMENT_CREATE: 'recruitment.create',
  RECRUITMENT_EDIT: 'recruitment.edit',
  RECRUITMENT_SCREEN: 'recruitment.screen',
  RECRUITMENT_SHORTLIST: 'recruitment.shortlist',
  RECRUITMENT_REJECT: 'recruitment.reject',
  RECRUITMENT_INTERVIEW_MOVE: 'recruitment.interview.move',
  RECRUITMENT_SELECT: 'recruitment.select',

  ONBOARDING_MANAGE: 'onboarding.manage',

  EMPLOYEE_CREATE: 'employee.create',
  EMPLOYEE_EDIT: 'employee.edit',
  EMPLOYEE_DELETE: 'employee.delete',

  ATTENDANCE_MANAGE: 'attendance.manage',
  LEAVE_APPLY: 'leave.apply',
  LEAVE_APPROVE: 'leave.approve',

  PAYROLL_PROCESS: 'payroll.process',

  TRAINING_MANAGE: 'training.manage',

  PERFORMANCE_GOAL_CREATE_SELF: 'performance.goal.create.self',
  PERFORMANCE_GOAL_MANAGE_TEAM: 'performance.goal.manage.team',
  PERFORMANCE_REVIEW: 'performance.review',

  EXIT_PROCESS: 'exit.process',

  SETTINGS_MANAGE: 'settings.manage',
  USER_MANAGE: 'user.manage'
};

// Centralized Page Authorization Map supporting anyOf (or) permission rules
export const PAGE_PERMISSION_MAP = {
  'Dashboard': [PERMISSIONS.DASHBOARD_VIEW],
  'Recruitment': [PERMISSIONS.RECRUITMENT_VIEW],
  'Onboarding': [PERMISSIONS.ONBOARDING_VIEW],
  'Employees': [PERMISSIONS.EMPLOYEE_VIEW, PERMISSIONS.EMPLOYEE_DIRECTORY_VIEW, PERMISSIONS.EMPLOYEE_SELF_VIEW],
  'Attendance & Leave': [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_SELF_VIEW, PERMISSIONS.LEAVE_APPLY],
  'Payroll': [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_SELF_VIEW],
  'Training': [PERMISSIONS.TRAINING_VIEW, PERMISSIONS.TRAINING_SELF_VIEW],
  'Performance': [PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_SELF_VIEW],
  'Exit Management': [PERMISSIONS.EXIT_VIEW, PERMISSIONS.EXIT_SELF_CREATE],
  'Reports': [PERMISSIONS.REPORTS_VIEW],
  'Settings': [PERMISSIONS.SETTINGS_VIEW],
  'System Health': [PERMISSIONS.HEALTH_VIEW]
};

// Role-specific navigation labels mapping
export const ROLE_NAV_LABELS = {
  [ROLES.SUPER_ADMIN]: {
    'Employees': 'Employee Directory & Legal',
    'Attendance & Leave': 'Daily Attendance & Leave',
    'Payroll': 'Payroll Processing & Payslips',
    'Training': 'Training & Learning',
    'Performance': 'KPI, KRA & Performance',
    'Exit Management': 'Exit & Offboarding Management'
  },
  [ROLES.EMPLOYEE]: {
    'Employees': 'My Profile & Legal',
    'Attendance & Leave': 'My Attendance Report & Leave',
    'Payroll': 'My Payslips',
    'Training': 'My Learning',
    'Performance': 'My KPIs & KRAs',
    'Exit Management': 'Resignation & Exit'
  }
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EMPLOYEE_SELF_VIEW,
    PERMISSIONS.ATTENDANCE_SELF_VIEW,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.PAYROLL_SELF_VIEW,
    PERMISSIONS.PAYSLIP_SELF_DOWNLOAD,
    PERMISSIONS.TRAINING_SELF_VIEW,
    PERMISSIONS.PERFORMANCE_SELF_VIEW,
    PERMISSIONS.PERFORMANCE_GOAL_CREATE_SELF,
    PERMISSIONS.EXIT_SELF_CREATE
  ]
};

// Role Default Scope Mapping per Sheet
export const DEFAULT_ROLE_SCOPES = {
  [ROLES.SUPER_ADMIN]: {
    'Employees': DATA_SCOPES.ALL,
    'Jobs': DATA_SCOPES.ALL,
    'Candidates': DATA_SCOPES.ALL,
    'Attendance': DATA_SCOPES.ALL,
    'LeaveRequests': DATA_SCOPES.ALL,
    'Payroll': DATA_SCOPES.ALL,
    'TrainingPrograms': DATA_SCOPES.ALL,
    'PerformanceGoals': DATA_SCOPES.ALL,
    'ExitRequests': DATA_SCOPES.ALL
  },
  [ROLES.EMPLOYEE]: {
    'Employees': DATA_SCOPES.SELF,
    'Attendance': DATA_SCOPES.SELF,
    'LeaveRequests': DATA_SCOPES.SELF,
    'PayrollItems': DATA_SCOPES.SELF,
    'TrainingAssignments': DATA_SCOPES.SELF,
    'PerformanceGoals': DATA_SCOPES.SELF,
    'ExitRequests': DATA_SCOPES.SELF
  }
};

export const ROLE_DATA_SCOPES = DEFAULT_ROLE_SCOPES;

// Standardized UI Enum Formatting Helper
export function formatEnumLabel(value) {
  if (!value) return 'N/A';
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}
