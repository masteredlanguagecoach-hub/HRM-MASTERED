// Local In-Memory & LocalStorage Database Driver with Versioned Non-Destructive Migration

import { MASTER_SHEETS } from './masterSchema.js';
import { DEFAULT_SETTINGS } from '../../config/defaultSettings.js';

const STORAGE_KEY_PREFIX = 'HRMS_DB_';
const SYNC_QUEUE_KEY = 'HRMS_SYNC_QUEUE';
const DB_VERSION_KEY = 'HRMS_DB_VERSION';
const CURRENT_DB_VERSION = '2.5';

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

  // Users (Distinct real accounts for all 8 roles)
  data.Users = [
    { UserID: 'USR-000001', FullName: 'Eleanor Vance', Email: 'admin@masteredhrms.com', Role: 'SUPER_ADMIN', DepartmentID: 'DEP-000002', EmployeeID: 'EMP-000001', Status: 'ACTIVE', CreatedAt: '2026-01-10', LastLogin: new Date().toISOString() },
    { UserID: 'USR-000010', FullName: 'Victoria Sterling', Email: 'hradmin@masteredhrms.com', Role: 'HR_ADMIN', DepartmentID: 'DEP-000002', EmployeeID: 'EMP-000010', Status: 'ACTIVE', CreatedAt: '2026-01-12', LastLogin: new Date().toISOString() },
    { UserID: 'USR-000011', FullName: 'Jordan Reed', Email: 'hrexec@masteredhrms.com', Role: 'HR_EXECUTIVE', DepartmentID: 'DEP-000002', EmployeeID: 'EMP-000011', Status: 'ACTIVE', CreatedAt: '2026-01-14', LastLogin: new Date().toISOString() },
    { UserID: 'USR-000002', FullName: 'Marcus Brodie', Email: 'recruiter@masteredhrms.com', Role: 'RECRUITER', DepartmentID: 'DEP-000002', EmployeeID: 'EMP-000003', Status: 'ACTIVE', CreatedAt: '2026-01-15', LastLogin: new Date().toISOString() },
    { UserID: 'USR-000004', FullName: 'Jessica Lin', Email: 'payroll@masteredhrms.com', Role: 'PAYROLL_ADMIN', DepartmentID: 'DEP-000004', EmployeeID: 'EMP-000004', Status: 'ACTIVE', CreatedAt: '2026-02-10', LastLogin: new Date().toISOString() },
    { UserID: 'USR-000012', FullName: 'Samantha Cross', Email: 'training@masteredhrms.com', Role: 'TRAINING_ADMIN', DepartmentID: 'DEP-000002', EmployeeID: 'EMP-000012', Status: 'ACTIVE', CreatedAt: '2026-02-15', LastLogin: new Date().toISOString() },
    { UserID: 'USR-000003', FullName: 'Elena Rostova', Email: 'elena@masteredhrms.com', Role: 'MANAGER', DepartmentID: 'DEP-000001', EmployeeID: 'EMP-000002', Status: 'ACTIVE', CreatedAt: '2026-02-01', LastLogin: new Date().toISOString() },
    { UserID: 'USR-000005', FullName: 'David Kim', Email: 'david.kim@masteredhrms.com', Role: 'EMPLOYEE', DepartmentID: 'DEP-000001', EmployeeID: 'EMP-000005', Status: 'ACTIVE', CreatedAt: '2026-03-01', LastLogin: new Date().toISOString() }
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

  // Jobs
  data.Jobs = [
    {
      JobID: 'JOB-000001',
      JobTitle: 'Senior Full Stack AI Engineer',
      DepartmentID: 'DEP-000001',
      DesignationID: 'DSG-000001',
      Vacancies: 2,
      EmploymentType: 'FULL_TIME',
      Location: 'San Francisco, CA / Remote',
      WorkMode: 'HYBRID',
      MinExperience: 4,
      MaxExperience: 8,
      MinSalary: 130000,
      MaxSalary: 175000,
      EducationRequirements: 'Bachelor or Master in Computer Science or Software Engineering',
      RequiredSkills: 'React, Node.js, JavaScript, Python, REST APIs, Git',
      PreferredSkills: 'Google Gemini API, OpenAI API, Cloud Architecture, Docker, GraphQL',
      RequiredCertifications: 'AWS Certified Developer or Google Cloud Associate Engineer',
      RequiredLanguages: 'English (Fluent)',
      RequiredIndustryExperience: 'Software SaaS, AI Products, FinTech',
      RequiredJobTitles: 'Full Stack Engineer, Senior Software Engineer, AI Developer',
      NoticePeriodRequirement: 'Immediate to 30 Days',
      JobDescription: 'We are seeking an outstanding Senior Full Stack AI Engineer to design and implement intelligent enterprise systems using cutting-edge web frameworks, RESTful backend APIs, and LLM providers.',
      Responsibilities: 'Architect reactive web components. Integrate Google AI & OpenAI models.',
      MandatoryRequirements: 'Minimum 4 years experience in Full Stack JS/Python. Deep familiarity with REST APIs & Cloud DBs.',
      PreferredRequirements: 'Experience with Google Workspace APIs (Sheets & Drive API), Apps Script, or automated workflow engines.',
      ApplicationDeadline: '2026-09-30',
      HiringManagerID: 'EMP-000002',
      RecruiterID: 'EMP-000003',
      Status: 'OPEN',
      CreatedAt: '2026-08-01',
      UpdatedAt: '2026-08-10'
    },
    {
      JobID: 'JOB-000002',
      JobTitle: 'Lead HR Operations Specialist',
      DepartmentID: 'DEP-000002',
      DesignationID: 'DSG-000002',
      Vacancies: 1,
      EmploymentType: 'FULL_TIME',
      Location: 'New York, NY',
      WorkMode: 'ON_SITE',
      MinExperience: 5,
      MaxExperience: 10,
      MinSalary: 95000,
      MaxSalary: 125000,
      EducationRequirements: 'Bachelor in Human Resources or Business Administration',
      RequiredSkills: 'HRMS Management, Employee Onboarding, Payroll Processing, Compliance',
      PreferredSkills: 'SHRM-CP certification, Google Workspace Automation',
      RequiredCertifications: 'SHRM-CP or PHR',
      RequiredLanguages: 'English',
      RequiredIndustryExperience: 'HR Consulting, Corporate HR',
      RequiredJobTitles: 'HR Lead, HR Generalist',
      NoticePeriodRequirement: '15 to 30 Days',
      JobDescription: 'Lead our core HR lifecycle operations.',
      Responsibilities: 'Oversee employee onboarding, manage performance review cadences.',
      MandatoryRequirements: 'At least 5 years hands-on experience in corporate HR management.',
      PreferredRequirements: 'Strong spreadsheet analytics.',
      ApplicationDeadline: '2026-09-15',
      HiringManagerID: 'EMP-000001',
      RecruiterID: 'EMP-000003',
      Status: 'OPEN',
      CreatedAt: '2026-08-05',
      UpdatedAt: '2026-08-05'
    }
  ];

  // Candidates
  data.Candidates = [
    {
      CandidateID: 'CAN-000001',
      JobID: 'JOB-000001',
      FullName: 'Alex Rivers',
      Email: 'alex.rivers@devmail.io',
      Phone: '+1-555-019-2834',
      Location: 'San Francisco, CA',
      CurrentCompany: 'Mastered HRMS Systems',
      CurrentDesignation: 'Senior Full Stack Developer',
      TotalExperience: 6,
      RelevantExperience: 5,
      HighestEducation: 'B.S. in Computer Science, UC Berkeley',
      Skills: 'React, Node.js, JavaScript, Python, REST APIs, Git, Google Gemini API, Docker',
      Certifications: 'Google Cloud Certified Professional Cloud Developer',
      Languages: 'English (Native)',
      CurrentSalary: 140000,
      ExpectedSalary: 160000,
      NoticePeriod: '15 Days',
      ResumeDriveFileID: 'DRV-FILE-RESUME-001',
      ResumeFileName: 'Alex_Rivers_Resume_2026.pdf',
      ResumeText: 'ALEX RIVERS\nSan Francisco, CA | alex.rivers@devmail.io\nSUMMARY: Senior Full Stack Engineer with 6 years experience building React/Node applications.',
      ApplicationSource: 'DIRECT_APPLICATION',
      ApplicationDate: '2026-08-10',
      AIStatus: 'AI_COMPLETED',
      AIScore: 91,
      AIRecommendation: 'STRONG_SHORTLIST',
      RecruiterStatus: 'SHORTLISTED',
      RecruiterDecision: 'SHORTLIST',
      AssignedRecruiter: 'EMP-000003',
      CreatedAt: '2026-08-10',
      UpdatedAt: '2026-08-11'
    },
    {
      CandidateID: 'CAN-000002',
      JobID: 'JOB-000001',
      FullName: 'Sarah Chen',
      Email: 'sarah.chen@techworks.com',
      Phone: '+1-555-028-4920',
      Location: 'San Jose, CA',
      CurrentCompany: 'Innovate Labs',
      CurrentDesignation: 'Full Stack Engineer',
      TotalExperience: 4.5,
      RelevantExperience: 4,
      HighestEducation: 'M.S. Software Engineering, Stanford',
      Skills: 'React, Node.js, JavaScript, Python, REST APIs, AWS',
      Certifications: 'AWS Certified Developer',
      Languages: 'English (Fluent)',
      CurrentSalary: 130000,
      ExpectedSalary: 155000,
      NoticePeriod: '30 Days',
      ResumeDriveFileID: 'DRV-FILE-RESUME-002',
      ResumeFileName: 'Sarah_Chen_CV.pdf',
      ResumeText: 'SARAH CHEN\nSan Jose, CA | sarah.chen@techworks.com\nFull Stack Engineer with 4.5 years total experience.',
      ApplicationSource: 'LINKEDIN',
      ApplicationDate: '2026-08-11',
      AIStatus: 'AI_COMPLETED',
      AIScore: 84,
      AIRecommendation: 'STRONG_SHORTLIST',
      RecruiterStatus: 'SHORTLISTED',
      RecruiterDecision: 'SHORTLIST',
      AssignedRecruiter: 'EMP-000003',
      CreatedAt: '2026-08-11',
      UpdatedAt: '2026-08-11'
    }
  ];

  // Employees
  data.Employees = [
    { EmployeeID: 'EMP-000001', FirstName: 'Eleanor', LastName: 'Vance', Email: 'admin@masteredhrms.com', Phone: '+1-555-100-0001', Gender: 'FEMALE', JoiningDate: '2024-01-15', DepartmentID: 'DEP-000002', DesignationID: 'DSG-000002', ManagerID: 'SELF', EmploymentType: 'FULL_TIME', WorkLocation: 'San Francisco, CA', Status: 'ACTIVE', BaseSalary: 150000, BankName: 'Chase Bank', AccountNumber: 'XXXX-9482', IFSC_Routing: '121000358', EmergencyContactName: 'Arthur Vance', EmergencyContactPhone: '+1-555-900-1122', DriveFolderID: 'DRV-EMP-001', CreatedAt: '2024-01-15' },
    { EmployeeID: 'EMP-000002', FirstName: 'Elena', LastName: 'Rostova', Email: 'elena@masteredhrms.com', Phone: '+1-555-100-0002', Gender: 'FEMALE', JoiningDate: '2024-03-01', DepartmentID: 'DEP-000001', DesignationID: 'DSG-000003', ManagerID: 'EMP-000001', EmploymentType: 'FULL_TIME', WorkLocation: 'San Francisco, CA', Status: 'ACTIVE', BaseSalary: 165000, BankName: 'Bank of America', AccountNumber: 'XXXX-3829', IFSC_Routing: '121000358', EmergencyContactName: 'Viktor Rostov', EmergencyContactPhone: '+1-555-900-3344', DriveFolderID: 'DRV-EMP-002', CreatedAt: '2024-03-01' },
    { EmployeeID: 'EMP-000003', FirstName: 'Marcus', LastName: 'Brodie', Email: 'recruiter@masteredhrms.com', Phone: '+1-555-100-0003', Gender: 'MALE', JoiningDate: '2025-02-01', DepartmentID: 'DEP-000002', DesignationID: 'DSG-000002', ManagerID: 'EMP-000001', EmploymentType: 'FULL_TIME', WorkLocation: 'New York, NY', Status: 'ACTIVE', BaseSalary: 95000, BankName: 'Wells Fargo', AccountNumber: 'XXXX-8821', IFSC_Routing: '121000358', EmergencyContactName: 'Laura Brodie', EmergencyContactPhone: '+1-555-900-5566', DriveFolderID: 'DRV-EMP-003', CreatedAt: '2025-02-01' },
    { EmployeeID: 'EMP-000004', FirstName: 'Jessica', LastName: 'Lin', Email: 'payroll@masteredhrms.com', Phone: '+1-555-100-0004', Gender: 'FEMALE', JoiningDate: '2025-04-15', DepartmentID: 'DEP-000004', DesignationID: 'DSG-000004', ManagerID: 'EMP-000001', EmploymentType: 'FULL_TIME', WorkLocation: 'San Francisco, CA', Status: 'ACTIVE', BaseSalary: 90000, BankName: 'Citibank', AccountNumber: 'XXXX-1109', IFSC_Routing: '121000358', EmergencyContactName: 'Kevin Lin', EmergencyContactPhone: '+1-555-900-7788', DriveFolderID: 'DRV-EMP-004', CreatedAt: '2025-04-15' },
    { EmployeeID: 'EMP-000005', FirstName: 'David', LastName: 'Kim', Email: 'david.kim@masteredhrms.com', Phone: '+1-555-100-0005', Gender: 'MALE', JoiningDate: '2025-06-01', DepartmentID: 'DEP-000001', DesignationID: 'DSG-000005', ManagerID: 'EMP-000002', EmploymentType: 'FULL_TIME', WorkLocation: 'San Francisco, CA', Status: 'ACTIVE', BaseSalary: 115000, BankName: 'Chase Bank', AccountNumber: 'XXXX-5541', IFSC_Routing: '121000358', EmergencyContactName: 'Grace Kim', EmergencyContactPhone: '+1-555-900-9900', DriveFolderID: 'DRV-EMP-005', CreatedAt: '2025-06-01' },
    { EmployeeID: 'EMP-000010', FirstName: 'Victoria', LastName: 'Sterling', Email: 'hradmin@masteredhrms.com', Phone: '+1-555-100-0010', Gender: 'FEMALE', JoiningDate: '2024-05-01', DepartmentID: 'DEP-000002', DesignationID: 'DSG-000002', ManagerID: 'EMP-000001', EmploymentType: 'FULL_TIME', WorkLocation: 'San Francisco, CA', Status: 'ACTIVE', BaseSalary: 130000, BankName: 'Chase Bank', AccountNumber: 'XXXX-1010', IFSC_Routing: '121000358', EmergencyContactName: 'Charles Sterling', EmergencyContactPhone: '+1-555-900-1010', DriveFolderID: 'DRV-EMP-010', CreatedAt: '2024-05-01' },
    { EmployeeID: 'EMP-000011', FirstName: 'Jordan', LastName: 'Reed', Email: 'hrexec@masteredhrms.com', Phone: '+1-555-100-0011', Gender: 'MALE', JoiningDate: '2025-01-10', DepartmentID: 'DEP-000002', DesignationID: 'DSG-000004', ManagerID: 'EMP-000010', EmploymentType: 'FULL_TIME', WorkLocation: 'San Francisco, CA', Status: 'ACTIVE', BaseSalary: 85000, BankName: 'Wells Fargo', AccountNumber: 'XXXX-1111', IFSC_Routing: '121000358', EmergencyContactName: 'Taylor Reed', EmergencyContactPhone: '+1-555-900-1111', DriveFolderID: 'DRV-EMP-011', CreatedAt: '2025-01-10' },
    { EmployeeID: 'EMP-000012', FirstName: 'Samantha', LastName: 'Cross', Email: 'training@masteredhrms.com', Phone: '+1-555-100-0012', Gender: 'FEMALE', JoiningDate: '2025-03-15', DepartmentID: 'DEP-000002', DesignationID: 'DSG-000004', ManagerID: 'EMP-000010', EmploymentType: 'FULL_TIME', WorkLocation: 'New York, NY', Status: 'ACTIVE', BaseSalary: 88000, BankName: 'Citibank', AccountNumber: 'XXXX-1212', IFSC_Routing: '121000358', EmergencyContactName: 'Morgan Cross', EmergencyContactPhone: '+1-555-900-1212', DriveFolderID: 'DRV-EMP-012', CreatedAt: '2025-03-15' }
  ];

  // Attendance
  data.Attendance = [
    { AttendanceID: 'ATT-000001', EmployeeID: 'EMP-000001', Date: '2026-08-18', CheckIn: '08:52', CheckOut: '18:05', WorkingHours: 9.2, LateMinutes: 0, EarlyDeparture: 0, Overtime: 0.2, Status: 'PRESENT', Source: 'WEB_APP', Remarks: 'On time' },
    { AttendanceID: 'ATT-000002', EmployeeID: 'EMP-000002', Date: '2026-08-18', CheckIn: '09:05', CheckOut: '18:30', WorkingHours: 9.4, LateMinutes: 5, EarlyDeparture: 0, Overtime: 0.4, Status: 'PRESENT', Source: 'WEB_APP', Remarks: 'On time' },
    { AttendanceID: 'ATT-000003', EmployeeID: 'EMP-000003', Date: '2026-08-18', CheckIn: '09:42', CheckOut: '18:00', WorkingHours: 8.3, LateMinutes: 42, EarlyDeparture: 0, Overtime: 0, Status: 'LATE', Source: 'WEB_APP', Remarks: 'Traffic' },
    { AttendanceID: 'ATT-000004', EmployeeID: 'EMP-000004', Date: '2026-08-18', CheckIn: '09:00', CheckOut: '18:00', WorkingHours: 9.0, LateMinutes: 0, EarlyDeparture: 0, Overtime: 0, Status: 'PRESENT', Source: 'WEB_APP', Remarks: '' },
    { AttendanceID: 'ATT-000005', EmployeeID: 'EMP-000005', Date: '2026-08-18', CheckIn: '09:00', CheckOut: '18:00', WorkingHours: 9.0, LateMinutes: 0, EarlyDeparture: 0, Overtime: 0, Status: 'WORK_FROM_HOME', Source: 'WEB_APP', Remarks: 'Approved WFH' }
  ];

  // Leave Requests & Balances
  data.LeaveBalances = [
    { BalanceID: 'BAL-000001', EmployeeID: 'EMP-000005', LeaveTypeID: 'LTP-000001', Year: 2026, AllocatedDays: 12, UsedDays: 2, PendingDays: 0, RemainingDays: 10 },
    { BalanceID: 'BAL-000002', EmployeeID: 'EMP-000002', LeaveTypeID: 'LTP-000001', Year: 2026, AllocatedDays: 12, UsedDays: 1, PendingDays: 1, RemainingDays: 10 }
  ];

  data.LeaveRequests = [
    { LeaveRequestID: 'LEV-000001', EmployeeID: 'EMP-000005', LeaveTypeID: 'LTP-000001', StartDate: '2026-08-20', EndDate: '2026-08-21', TotalDays: 2, Reason: 'Personal family event', Status: 'APPROVED', AppliedAt: '2026-08-01', ApprovedBy: 'EMP-000002', ApprovedAt: '2026-08-02' },
    { LeaveRequestID: 'LEV-000002', EmployeeID: 'EMP-000005', LeaveTypeID: 'LTP-000002', StartDate: '2026-08-28', EndDate: '2026-08-28', TotalDays: 1, Reason: 'Doctor appointment', Status: 'PENDING', AppliedAt: '2026-08-15', ApprovedBy: '' }
  ];

  // Payroll
  data.Payroll = [
    { PayrollID: 'PAY-2026-07', MonthYear: '2026-07', TotalEmployees: 8, TotalGross: 78000, TotalDeductions: 12000, TotalNet: 66000, Status: 'PAID', ProcessedBy: 'EMP-000004', ProcessedAt: '2026-07-28', ApprovedBy: 'EMP-000001', ApprovedAt: '2026-07-29' }
  ];

  data.PayrollItems = [
    { PayrollItemID: 'PIT-000001', PayrollID: 'PAY-2026-07', EmployeeID: 'EMP-000001', MonthYear: '2026-07', BaseSalary: 12500, Allowances: 1500, OvertimePay: 0, GrossSalary: 14000, NetSalary: 11500, PayslipDriveFileID: 'DRV-PAYSLIP-EMP01-JUL26', Status: 'PAID', PaidAt: '2026-07-30' },
    { PayrollItemID: 'PIT-000002', PayrollID: 'PAY-2026-07', EmployeeID: 'EMP-000005', MonthYear: '2026-07', BaseSalary: 9583, Allowances: 1200, OvertimePay: 150, GrossSalary: 10933, NetSalary: 8984, PayslipDriveFileID: 'DRV-PAYSLIP-EMP05-JUL26', Status: 'PAID', PaidAt: '2026-07-30' }
  ];

  // Training
  data.TrainingPrograms = [
    { TrainingID: 'TRN-000001', TrainingName: 'Generative AI & LLM Systems Workshop', Description: 'Advanced prompt engineering & API orchestration', Trainer: 'Dr. Aris Thorne', Category: 'TECHNICAL', StartDate: '2026-08-25', EndDate: '2026-08-27', DurationHours: 12, Capacity: 15, Status: 'UPCOMING', CreatedAt: '2026-08-01' }
  ];

  data.TrainingAssignments = [
    { AssignmentID: 'TAS-000001', TrainingID: 'TRN-000001', EmployeeID: 'EMP-000005', AssignedBy: 'EMP-000012', Status: 'ASSIGNED', CompletionDate: '', Score: 0 }
  ];

  // Performance
  data.PerformanceGoals = [
    { GoalID: 'GOL-000001', EmployeeID: 'EMP-000005', ReviewPeriod: 'Q3-2026', GoalTitle: 'Implement AI CV Screening Engine', KPI_KRA: 'Recruitment turnaround time reduction', TargetMetric: '100% automated parsing accuracy', DueDate: '2026-09-30', ProgressPercent: 85, Status: 'IN_PROGRESS', CreatedAt: '2026-07-01' }
  ];

  data.PerformanceReviews = [
    { ReviewID: 'REV-000001', EmployeeID: 'EMP-000005', ReviewPeriod: 'H1-2026', SelfAssessment: 'Led UI refactoring and backend optimization.', ManagerAssessment: 'Exceeded expectations in delivery.', SelfRating: 4, ManagerRating: 5, FinalRating: 4.8, Status: 'COMPLETED', SubmittedAt: '2026-06-25', CompletedAt: '2026-06-30' }
  ];

  // Exit
  data.ExitRequests = [
    { ExitRequestID: 'EXT-000001', EmployeeID: 'EMP-000003', ResignationDate: '2026-08-01', NoticePeriodDays: 30, RequestedLastWorkingDay: '2026-08-31', Reason: 'Career advancement opportunity', Status: 'PENDING' }
  ];

  // Audit Logs
  data.AuditLogs = [
    { AuditID: 'AUD-000001', UserID: 'USR-000001', UserEmail: 'admin@masteredhrms.com', Action: 'SYSTEM_INITIALIZATION', Module: 'SETTINGS', EntityID: 'MASTER', PreviousState: '', NewState: 'Initial database pre-seeded with 8 role accounts', IPAddress: '127.0.0.1', Timestamp: new Date().toISOString() }
  ];

  return data;
}

/**
 * Non-destructive Versioned Database Migration Function
 */
function migrateDatabaseIfNeeded(existingDb) {
  const initial = createInitialData();
  if (!existingDb || typeof existingDb !== 'object') return initial;

  // 1. Ensure all master sheet arrays exist
  Object.keys(MASTER_SHEETS).forEach(sheetName => {
    if (!Array.isArray(existingDb[sheetName])) {
      existingDb[sheetName] = initial[sheetName] || [];
    }
  });

  // 2. Non-destructively upsert seeded Users without overwriting user changes
  const existingUsers = existingDb.Users || [];
  initial.Users.forEach(seededUser => {
    const found = existingUsers.find(u => u.Email === seededUser.Email || u.UserID === seededUser.UserID);
    if (!found) {
      existingUsers.push(seededUser);
    } else {
      // Ensure Role, EmployeeID and Status are correctly set
      found.Role = seededUser.Role;
      found.EmployeeID = seededUser.EmployeeID;
      found.Status = 'ACTIVE';
    }
  });
  existingDb.Users = existingUsers;

  // 3. Non-destructively upsert seeded Employees
  const existingEmp = existingDb.Employees || [];
  initial.Employees.forEach(seededEmp => {
    const found = existingEmp.find(e => e.EmployeeID === seededEmp.EmployeeID || e.Email === seededEmp.Email);
    if (!found) {
      existingEmp.push(seededEmp);
    }
  });
  existingDb.Employees = existingEmp;

  return existingDb;
}

let memoryDb = null;
let syncQueue = null;

export const localDbDriver = {
  init() {
    try {
      if (typeof localStorage !== 'undefined') {
        const storedVersion = localStorage.getItem(DB_VERSION_KEY);
        const stored = localStorage.getItem(STORAGE_KEY_PREFIX + 'MASTER');

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (storedVersion !== CURRENT_DB_VERSION) {
              // Run versioned migration to add missing role accounts
              memoryDb = migrateDatabaseIfNeeded(parsed);
              localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
              this.persist();
            } else {
              memoryDb = parsed;
            }
          } catch (err) {
            console.warn('Database JSON parse error, re-initializing', err);
            memoryDb = createInitialData();
          }
        }
        const storedQueue = localStorage.getItem(SYNC_QUEUE_KEY);
        if (storedQueue) {
          syncQueue = JSON.parse(storedQueue);
        }
      }
    } catch (e) {
      console.warn('LocalStorage error, using in-memory data', e);
    }
    if (!memoryDb) {
      memoryDb = createInitialData();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
      }
      this.persist();
    }
    if (!syncQueue) {
      syncQueue = [];
      this.saveSyncQueue(syncQueue);
    }
  },

  hydrateFromRemote(remoteDataMap) {
    if (!remoteDataMap || typeof remoteDataMap !== 'object') return false;
    if (!memoryDb) memoryDb = createInitialData();

    Object.keys(remoteDataMap).forEach(sheetName => {
      if (Array.isArray(remoteDataMap[sheetName])) {
        memoryDb[sheetName] = remoteDataMap[sheetName];
      }
    });

    this.persist();
    return true;
  },

  getSyncQueue() {
    if (!syncQueue) this.init();
    return syncQueue || [];
  },

  saveSyncQueue(queue) {
    syncQueue = queue || [];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue));
      }
    } catch (e) {
      console.error('Failed to persist sync queue', e);
    }
  },

  persist() {
    try {
      if (memoryDb && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'MASTER', JSON.stringify(memoryDb));
      }
    } catch (e) {
      console.error('Failed to persist database state', e);
    }
  },

  getAll(sheetName) {
    if (!memoryDb) this.init();
    if (!memoryDb[sheetName]) memoryDb[sheetName] = [];
    return memoryDb[sheetName];
  },

  getById(sheetName, idField, idValue) {
    const list = this.getAll(sheetName);
    return list.find(item => String(item[idField]) === String(idValue)) || null;
  },

  query(sheetName, predicate) {
    const list = this.getAll(sheetName);
    return list.filter(predicate);
  },

  insert(sheetName, record) {
    if (!memoryDb) this.init();
    if (!memoryDb[sheetName]) memoryDb[sheetName] = [];
    
    const now = new Date().toISOString();
    if (!record.CreatedAt) record.CreatedAt = now;
    if (!record.UpdatedAt) record.UpdatedAt = now;

    memoryDb[sheetName].push(record);
    this.persist();

    if (sheetName !== 'AuditLogs' && sheetName !== 'Notifications') {
      this.insert('AuditLogs', {
        AuditID: 'AUD-' + String(Date.now()).slice(-6) + Math.floor(Math.random() * 100),
        UserID: 'CURRENT_USER',
        UserEmail: 'admin@masteredhrms.com',
        Action: `INSERT_${sheetName.toUpperCase()}`,
        Module: sheetName,
        EntityID: record[Object.keys(record)[0]] || 'NEW_RECORD',
        PreviousState: '',
        NewState: JSON.stringify(record),
        IPAddress: '127.0.0.1',
        Timestamp: now
      });
    }

    return record;
  },

  update(sheetName, idField, idValue, updateFields) {
    if (!memoryDb) this.init();
    const list = this.getAll(sheetName);
    const index = list.findIndex(item => String(item[idField]) === String(idValue));
    
    if (index === -1) {
      console.warn(`Record with ${idField} = ${idValue} not found in ${sheetName}`);
      return updateFields;
    }

    const previousState = JSON.stringify(list[index]);
    list[index] = {
      ...list[index],
      ...updateFields,
      UpdatedAt: new Date().toISOString()
    };

    this.persist();

    if (sheetName !== 'AuditLogs') {
      this.insert('AuditLogs', {
        AuditID: 'AUD-' + String(Date.now()).slice(-6) + Math.floor(Math.random() * 100),
        UserID: 'CURRENT_USER',
        UserEmail: 'admin@masteredhrms.com',
        Action: `UPDATE_${sheetName.toUpperCase()}`,
        Module: sheetName,
        EntityID: String(idValue),
        PreviousState: previousState,
        NewState: JSON.stringify(updateFields),
        IPAddress: '127.0.0.1',
        Timestamp: new Date().toISOString()
      });
    }

    return list[index];
  },

  delete(sheetName, idField, idValue) {
    if (!memoryDb) this.init();
    const list = this.getAll(sheetName);
    const index = list.findIndex(item => String(item[idField]) === String(idValue));

    if (index !== -1) {
      const removed = list.splice(index, 1)[0];
      this.persist();
      return removed;
    }
    return null;
  },

  resetToDefaults() {
    memoryDb = createInitialData();
    syncQueue = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
    }
    this.persist();
    this.saveSyncQueue(syncQueue);
    return true;
  }
};

localDbDriver.init();
