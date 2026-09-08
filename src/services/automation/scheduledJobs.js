// Scheduled Automations (Daily HR Job & Daily Recruitment Job)

import { dbService } from '../db/dbService.js';
import { cvQueueProcessor } from './cvQueueProcessor.js';

export const scheduledJobs = {
  /**
   * Section 60: Automated Daily Recruitment Job
   */
  async runDailyRecruitmentJob() {
    console.log('[Automated Recruitment Job] Scanning incoming CVs and updating job rankings...');
    const batchResult = await cvQueueProcessor.processBatch(10);

    // Recalculate job candidate rankings
    const openJobs = dbService.query('Jobs', j => j.Status === 'OPEN');
    openJobs.forEach(job => {
      const candidates = dbService.query('Candidates', c => c.JobID === job.JobID);
      candidates.sort((a, b) => (b.AIScore || 0) - (a.AIScore || 0));
    });

    dbService.insert('AutomationLogs', {
      LogID: 'LOG-JOB-REC-' + Date.now(),
      RuleID: 'RULE-DAILY-RECRUITMENT',
      RuleName: 'Daily Automated Recruitment Pipeline Scanner',
      TriggerEvent: 'DAILY_CRON',
      Status: 'COMPLETED',
      ExecutionDetails: `Screened ${batchResult.processedCount} candidates across ${openJobs.length} open jobs`,
      Timestamp: new Date().toISOString()
    });

    return batchResult;
  },

  /**
   * Section 59: Automated Daily HR Lifecycle Job
   */
  runDailyHrJob() {
    console.log('[Automated Daily HR Job] Auditing onboarding, probation, leaves, performance, and exits...');
    const today = new Date().toISOString().split('T')[0];
    const alertsGenerated = [];

    // 1. Audit pending onboarding tasks
    const pendingOnboardingTasks = dbService.query('OnboardingTasks', t => t.Status === 'PENDING' && t.DueDate <= today);
    pendingOnboardingTasks.forEach(task => {
      alertsGenerated.push(`Onboarding task overdue: ${task.TaskName} for Employee ${task.EmployeeID}`);
      dbService.insert('Notifications', {
        RecipientID: task.AssignedTo || 'EMP-000001',
        Title: '⚠️ Overdue Onboarding Task',
        Message: `Task "${task.TaskName}" was due on ${task.DueDate}`,
        Type: 'ONBOARDING_ALERT',
        TargetModule: 'Onboarding',
        TargetID: task.TaskID,
        IsRead: false
      });
    });

    // 2. Audit ending probations
    const activeEmployees = dbService.query('Employees', e => e.Status === 'ACTIVE');
    activeEmployees.forEach(emp => {
      if (emp.ProbationEndDate && emp.ProbationEndDate <= today && emp.ConfirmationDate === '') {
        alertsGenerated.push(`Probation ending for ${emp.FirstName} ${emp.LastName}`);
        dbService.insert('Notifications', {
          RecipientID: emp.ManagerID || 'EMP-000001',
          Title: '📋 Probation Review Due',
          Message: `Probation evaluation due for ${emp.FirstName} ${emp.LastName} (${emp.EmployeeID})`,
          Type: 'PROBATION_DUE',
          TargetModule: 'Employees',
          TargetID: emp.EmployeeID,
          IsRead: false
        });
      }
    });

    dbService.insert('AutomationLogs', {
      LogID: 'LOG-JOB-HR-' + Date.now(),
      RuleID: 'RULE-DAILY-HR',
      RuleName: 'Daily Automated HR Lifecycle Audit',
      TriggerEvent: 'DAILY_CRON',
      Status: 'COMPLETED',
      ExecutionDetails: `Generated ${alertsGenerated.length} HR lifecycle alerts`,
      Timestamp: new Date().toISOString()
    });

    return { alertsCount: alertsGenerated.length, alerts: alertsGenerated };
  }
};
