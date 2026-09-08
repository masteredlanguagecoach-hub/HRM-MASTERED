// Master Google Sheets Schema Definitions (38 Master Sheets + JobEnquiries & EmployeeLegalContracts)

export const MASTER_SHEETS = {
  Settings: [
    'SettingKey', 'SettingValue', 'Category', 'UpdatedAt', 'UpdatedBy'
  ],
  Users: [
    'UserID', 'FullName', 'Email', 'Role', 'DepartmentID', 'EmployeeID', 'Status', 'CreatedAt', 'LastLogin'
  ],
  Departments: [
    'DepartmentID', 'DepartmentName', 'Code', 'HeadEmployeeID', 'Status', 'CreatedAt'
  ],
  Designations: [
    'DesignationID', 'DesignationTitle', 'DepartmentID', 'Level', 'Status', 'CreatedAt'
  ],
  Jobs: [
    'JobID', 'JobTitle', 'DepartmentID', 'DesignationID', 'Vacancies', 'EmploymentType',
    'Location', 'WorkMode', 'MinExperience', 'MaxExperience', 'MinSalary', 'MaxSalary',
    'EducationRequirements', 'RequiredSkills', 'PreferredSkills', 'RequiredCertifications',
    'RequiredLanguages', 'RequiredIndustryExperience', 'RequiredJobTitles', 'NoticePeriodRequirement',
    'JobDescription', 'Responsibilities', 'MandatoryRequirements', 'PreferredRequirements',
    'ApplicationDeadline', 'HiringManagerID', 'RecruiterID', 'Status', 'CreatedAt', 'UpdatedAt'
  ],
  JobEnquiries: [
    'EnquiryID', 'EnquiryType', 'JobID', 'FullName', 'Email', 'Phone', 'CurrentLocation',
    'CurrentCompany', 'CurrentDesignation', 'TotalExperience', 'RelevantExperience',
    'HighestEducation', 'Skills', 'Certifications', 'CurrentSalary', 'ExpectedSalary',
    'NoticePeriod', 'PreferredRole', 'PreferredDepartment', 'PreferredLocation',
    'EmploymentPreference', 'CandidateMessage', 'ApplicationSource', 'SourceReference',
    'PrivacyConsent', 'ConsentTimestamp', 'ResumeDriveFileID', 'ResumeFileName',
    'CoverLetterDriveFileID', 'SupportingDocumentDriveFileID', 'AssignedRecruiterID',
    'Status', 'DuplicateStatus', 'ConvertedCandidateID', 'ConvertedApplicationID',
    'SubmittedAt', 'ContactedAt', 'ConvertedAt', 'ClosedAt', 'CreatedAt', 'UpdatedAt'
  ],
  Candidates: [
    'CandidateID', 'JobID', 'FullName', 'Email', 'Phone', 'Location', 'CurrentCompany',
    'CurrentDesignation', 'TotalExperience', 'RelevantExperience', 'HighestEducation',
    'Skills', 'Certifications', 'Languages', 'CurrentSalary', 'ExpectedSalary', 'NoticePeriod',
    'ResumeDriveFileID', 'ResumeFileName', 'ResumeText', 'ApplicationSource', 'ApplicationDate',
    'AIStatus', 'AIScore', 'AIRecommendation', 'RecruiterStatus', 'RecruiterDecision',
    'AssignedRecruiter', 'CreatedAt', 'UpdatedAt'
  ],
  CandidateScreenings: [
    'ScreeningID', 'CandidateID', 'JobID', 'ResumeDriveFileID', 'AIProvider', 'AIModel',
    'PromptVersion', 'ScreeningDate', 'OverallScore', 'Recommendation', 'Confidence',
    'MandatoryMatchScore', 'ExperienceScore', 'SkillsScore', 'EducationScore',
    'CertificationScore', 'IndustryScore', 'LanguageScore', 'MatchedRequirements',
    'MissingRequirements', 'UnclearRequirements', 'Strengths', 'Weaknesses', 'RiskFlags',
    'AIExplanation', 'HumanDecision', 'HumanDecisionBy', 'HumanDecisionAt', 'OverrideReason',
    'ProcessingStatus', 'ErrorMessage'
  ],
  Interviews: [
    'InterviewID', 'CandidateID', 'JobID', 'RoundName', 'ScheduledTime', 'DurationMinutes',
    'InterviewerIDs', 'MeetingLink', 'Feedback', 'Rating', 'Decision', 'Status', 'CreatedAt'
  ],
  Offers: [
    'OfferID', 'CandidateID', 'JobID', 'DesignationID', 'DepartmentID', 'OfferedSalary',
    'JoiningDate', 'OfferLetterDriveFileID', 'Status', 'SentAt', 'AcceptedAt', 'Remarks'
  ],
  Onboarding: [
    'OnboardingID', 'CandidateID', 'EmployeeID', 'JobID', 'JoiningDate', 'OnboardingStatus',
    'FolderDriveID', 'CompletedTasksCount', 'TotalTasksCount', 'CompletedAt', 'CreatedAt'
  ],
  OnboardingTasks: [
    'TaskID', 'OnboardingID', 'EmployeeID', 'TaskName', 'AssignedTo', 'DueDate',
    'Status', 'CompletedDate', 'CompletedBy', 'Remarks'
  ],
  Employees: [
    'EmployeeID', 'CandidateID', 'FirstName', 'LastName', 'Email', 'Phone', 'Gender',
    'DateOfBirth', 'JoiningDate', 'DepartmentID', 'DesignationID', 'ManagerID',
    'EmploymentType', 'WorkLocation', 'Status', 'ProbationEndDate', 'ConfirmationDate',
    'BaseSalary', 'BankName', 'AccountNumber', 'IFSC_Routing', 'EmergencyContactName',
    'EmergencyContactPhone', 'CreatedAt', 'UpdatedAt'
  ],
  EmployeeLegalContracts: [
    'ContractID', 'EmployeeID', 'ContractType', 'TaxID_SSN', 'WorkPermitStatus',
    'WorkPermitExpiry', 'DocumentDriveFileID', 'DocumentFileName', 'EffectiveDate',
    'ExpiryDate', 'SignedStatus', 'SignedAt', 'WitnessedBy', 'Notes', 'CreatedAt', 'UpdatedAt'
  ],
  CandidateDocuments: [
    'DocumentID', 'CandidateID', 'EnquiryID', 'DocumentType', 'FileName', 'DriveFileID',
    'UploadedAt', 'Status'
  ],
  CandidateConsents: [
    'ConsentID', 'Email', 'EnquiryID', 'ConsentGiven', 'ConsentType', 'IPAddress', 'Timestamp'
  ],
  EmailLogs: [
    'LogID', 'SenderEmail', 'RecipientEmail', 'Subject', 'TemplateID', 'DriveFileID',
    'Status', 'SentAt', 'ErrorMessage'
  ],
  ApplicationSources: [
    'SourceID', 'SourceName', 'Category', 'IsActive'
  ],
  Attendance: [
    'AttendanceID', 'EmployeeID', 'Date', 'CheckIn', 'CheckOut', 'WorkingHours',
    'Status', 'Remarks'
  ],
  LeaveRequests: [
    'LeaveRequestID', 'EmployeeID', 'LeaveTypeID', 'StartDate', 'EndDate', 'TotalDays',
    'Reason', 'Status', 'AppliedAt', 'ApprovedBy'
  ],
  LeaveBalances: [
    'BalanceID', 'EmployeeID', 'LeaveTypeID', 'TotalAllowed', 'UsedDays', 'RemainingDays'
  ],
  Payroll: [
    'PayrollID', 'MonthYear', 'TotalEmployees', 'TotalGross', 'TotalDeductions',
    'TotalNet', 'Status', 'ProcessedBy', 'ProcessedAt'
  ],
  PayrollItems: [
    'ItemID', 'PayrollID', 'EmployeeID', 'MonthYear', 'BaseSalary', 'Allowances',
    'GrossSalary', 'Deductions', 'NetSalary', 'PayslipDriveFileID', 'Status'
  ],
  TrainingPrograms: [
    'TrainingID', 'TrainingName', 'Category', 'Trainer', 'DurationHours', 'StartDate',
    'EndDate', 'Status'
  ],
  TrainingAssignments: [
    'AssignmentID', 'TrainingID', 'EmployeeID', 'AssignedBy', 'Status', 'CompletionDate', 'Score'
  ],
  PerformanceGoals: [
    'GoalID', 'EmployeeID', 'ReviewPeriod', 'GoalTitle', 'KPI_KRA', 'TargetMetric',
    'DueDate', 'ProgressPercent', 'Status'
  ],
  PerformanceReviews: [
    'ReviewID', 'EmployeeID', 'ReviewPeriod', 'SelfRating', 'ManagerRating', 'FinalRating',
    'Comments', 'Status'
  ],
  ExitRequests: [
    'ExitRequestID', 'EmployeeID', 'ResignationDate', 'NoticePeriodDays', 'RequestedLastWorkingDay',
    'Reason', 'Status', 'ApprovedBy'
  ],
  AuditLogs: [
    'AuditID', 'UserEmail', 'Action', 'Module', 'Details', 'Timestamp'
  ],
  Notifications: [
    'NotificationID', 'UserEmail', 'Title', 'Message', 'IsRead', 'CreatedAt'
  ]
};
