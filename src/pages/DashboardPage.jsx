// Role-Specific Dashboard Page Component (100% Calculated Dynamic Metrics - Zero Hardcoded Values)

import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, StatCard, ContentCard, DataTable, StatusBadge, Button } from '../components/common/UIComponents.jsx';
import { ROLES } from '../config/constants.js';

export function DashboardPage() {
  const { currentUser } = useAuth();
  const { setActiveTab } = useApp();

  const role = currentUser?.Role || ROLES.EMPLOYEE;

  // Retrieve scoped records for authenticated user session
  const employees = dbService.getAll('Employees', currentUser) || [];
  const attendance = dbService.getAll('Attendance', currentUser) || [];
  const leaveRequests = dbService.getAll('LeaveRequests', currentUser) || [];
  const leaveBalances = dbService.getAll('LeaveBalances', currentUser) || [];
  const jobs = dbService.getAll('Jobs', currentUser) || [];
  const candidates = dbService.getAll('Candidates', currentUser) || [];
  const payroll = dbService.getAll('Payroll', currentUser) || [];
  const payrollItems = dbService.getAll('PayrollItems', currentUser) || [];
  const trainingPrograms = dbService.getAll('TrainingPrograms', currentUser) || [];
  const trainingAssignments = dbService.getAll('TrainingAssignments', currentUser) || [];
  const goals = dbService.getAll('PerformanceGoals', currentUser) || [];
  const reviews = dbService.getAll('PerformanceReviews', currentUser) || [];
  const exitRequests = dbService.getAll('ExitRequests', currentUser) || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const myAttendanceToday = attendance.find(a => a.Date === todayStr && String(a.EmployeeID) === String(currentUser?.EmployeeID));
  const latestPayroll = payroll[0] || null;

  return (
    <div className="dashboard-view">
      <PageHeader
        title={`Welcome back, ${currentUser?.FullName?.split(' ')[0] || 'User'}!`}
        subtitle={`Role: ${role.replace('_', ' ')} | Authorized Workspace Session`}
        actions={
          <Button
            variant="secondary"
            onClick={() => setActiveTab(role === ROLES.EMPLOYEE ? 'Attendance & Leave' : 'Reports')}
            icon={role === ROLES.EMPLOYEE ? 'attendance' : 'reports'}
          >
            {role === ROLES.EMPLOYEE ? 'My Attendance' : 'View Reports'}
          </Button>
        }
      />

      {/* --- 1. SUPER ADMIN / HR ADMIN / HR EXECUTIVE DASHBOARD --- */}
      {(role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN || role === ROLES.HR_EXECUTIVE) && (
        <>
          <div className="metrics-grid">
            <StatCard
              title="Total Headcount"
              value={employees.length}
              subtitle="Active Workforce"
              iconName="employees"
              iconBg="#e0f2fe"
              iconColor="#0284c7"
            />
            <StatCard
              title="Open Requisitions"
              value={jobs.filter(j => j.Status === 'OPEN').length}
              subtitle={`${jobs.length} Total Jobs`}
              iconName="recruitment"
              iconBg="#dcfce7"
              iconColor="#16a34a"
            />
            <StatCard
              title="Candidate Pipeline"
              value={candidates.length}
              subtitle={`${candidates.filter(c => c.AIRecommendation === 'STRONG_SHORTLIST').length} AI Shortlisted`}
              iconName="onboarding"
              iconBg="#fef3c7"
              iconColor="#d97706"
            />
            <StatCard
              title="Payroll Net Total"
              value={latestPayroll?.TotalNet ? `$${latestPayroll.TotalNet.toLocaleString()}` : '$0'}
              subtitle={`Status: ${latestPayroll?.Status || 'DRAFT'} (${latestPayroll?.MonthYear || 'Current'})`}
              iconName="payroll"
              iconBg="#f3e8ff"
              iconColor="#9333ea"
            />
          </div>

          <div className="dashboard-grid-2">
            <ContentCard title="Recent Candidates in Pipeline">
              <DataTable
                columns={[
                  { header: 'Name', accessor: 'FullName' },
                  { header: 'Applied Job', accessor: 'JobID' },
                  { header: 'AI Score', render: (row) => <StatusBadge status={`${row.AIScore || 0}%`} type={row.AIScore >= 80 ? 'success' : 'warning'} /> },
                  { header: 'Recommendation', render: (row) => <StatusBadge status={row.AIRecommendation || 'PENDING'} type="info" /> }
                ]}
                data={candidates.slice(0, 5)}
              />
            </ContentCard>

            <ContentCard title="Pending Exit & Clearance Requests">
              <DataTable
                columns={[
                  { header: 'Employee ID', accessor: 'EmployeeID' },
                  { header: 'Resignation Date', accessor: 'ResignationDate' },
                  { header: 'Notice Period', render: (row) => `${row.NoticePeriodDays} Days` },
                  { header: 'Status', render: (row) => <StatusBadge status={row.Status} type={row.Status === 'APPROVED' ? 'success' : 'warning'} /> }
                ]}
                data={exitRequests}
                emptyMessage="No pending exit clearance requests"
              />
            </ContentCard>
          </div>
        </>
      )}

      {/* --- 2. EMPLOYEE DASHBOARD --- */}
      {role === ROLES.EMPLOYEE && (
        <>
          <div className="metrics-grid">
            <StatCard
              title="Today's Attendance"
              value={myAttendanceToday ? myAttendanceToday.Status : 'NOT CLOCKED IN'}
              subtitle={myAttendanceToday ? `Check In: ${myAttendanceToday.CheckIn}` : 'Clock-in available'}
              iconName="attendance"
              iconBg={myAttendanceToday ? '#dcfce7' : '#fef3c7'}
              iconColor={myAttendanceToday ? '#16a34a' : '#d97706'}
            />
            <StatCard
              title="Annual Leave Balance"
              value={`${leaveBalances[0]?.RemainingDays ?? 0} Days`}
              subtitle={`Allocated: ${leaveBalances[0]?.AllocatedDays ?? 0} | Used: ${leaveBalances[0]?.UsedDays ?? 0}`}
              iconName="onboarding"
              iconBg="#e0f2fe"
              iconColor="#0284c7"
            />
            <StatCard
              title="Latest Net Payslip"
              value={payrollItems[0]?.NetSalary ? `$${payrollItems[0].NetSalary.toLocaleString()}` : '$0'}
              subtitle={`Cycle: ${payrollItems[0]?.MonthYear || 'N/A'} (${payrollItems[0]?.Status || 'PAID'})`}
              iconName="payroll"
              iconBg="#fef3c7"
              iconColor="#d97706"
            />
            <StatCard
              title="Assigned Learning"
              value={`${trainingAssignments.length} Courses`}
              subtitle={trainingPrograms[0]?.TrainingName || 'No pending courses'}
              iconName="training"
              iconBg="#f3e8ff"
              iconColor="#9333ea"
            />
          </div>

          <div className="dashboard-grid-2">
            <ContentCard title="My Active Performance Goals">
              {goals.length === 0 ? (
                <p className="text-sub">No active performance goals assigned.</p>
              ) : (
                goals.map(g => (
                  <div key={g.GoalID} className="goal-item-card">
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--slate-900)' }}>{g.GoalTitle}</div>
                    <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px' }}>
                      KPI: {g.KPI_KRA} | Target Due: {g.DueDate} | Progress: <strong>{g.ProgressPercent}%</strong>
                    </div>
                  </div>
                ))
              )}
            </ContentCard>

            <ContentCard title="My Leave Applications">
              <DataTable
                columns={[
                  { header: 'Reason', accessor: 'Reason' },
                  { header: 'Dates', render: (row) => `${row.StartDate} to ${row.EndDate}` },
                  { header: 'Days', render: (row) => `${row.TotalDays} Days` },
                  { header: 'Status', render: (row) => <StatusBadge status={row.Status} type={row.Status === 'APPROVED' ? 'success' : 'warning'} /> }
                ]}
                data={leaveRequests}
                emptyMessage="No leave applications submitted"
              />
            </ContentCard>
          </div>
        </>
      )}

      {/* --- 3. MANAGER DASHBOARD --- */}
      {role === ROLES.MANAGER && (
        <>
          <div className="metrics-grid">
            <StatCard
              title="Direct Reports"
              value={employees.length}
              subtitle="Assigned Team Members"
              iconName="employees"
              iconBg="#e0f2fe"
              iconColor="#0284c7"
            />
            <StatCard
              title="Pending Leave Approvals"
              value={leaveRequests.filter(l => l.Status === 'PENDING').length}
              subtitle="Requires Manager Action"
              iconName="attendance"
              iconBg="#fef3c7"
              iconColor="#d97706"
            />
            <StatCard
              title="Team Present Today"
              value={`${attendance.filter(a => a.Date === todayStr && a.Status === 'PRESENT').length} / ${employees.length}`}
              subtitle="Daily Team Check-ins"
              iconName="dashboard"
              iconBg="#dcfce7"
              iconColor="#16a34a"
            />
            <StatCard
              title="Assigned Interviews"
              value={candidates.filter(c => c.RecruiterStatus === 'INTERVIEW_1' || c.RecruiterStatus === 'INTERVIEW_2').length}
              subtitle="Active Hiring Evaluations"
              iconName="recruitment"
              iconBg="#f3e8ff"
              iconColor="#9333ea"
            />
          </div>

          <ContentCard title="Team Leave Approval Queue">
            <DataTable
              columns={[
                { header: 'Employee ID', accessor: 'EmployeeID' },
                { header: 'Reason', accessor: 'Reason' },
                { header: 'Duration', render: (row) => `${row.StartDate} to ${row.EndDate} (${row.TotalDays} Days)` },
                { header: 'Status', render: (row) => <StatusBadge status={row.Status} type={row.Status === 'APPROVED' ? 'success' : 'warning'} /> }
              ]}
              data={leaveRequests}
              emptyMessage="No team leave approvals pending"
            />
          </ContentCard>
        </>
      )}

      {/* --- 4. RECRUITER DASHBOARD --- */}
      {role === ROLES.RECRUITER && (
        <>
          <div className="metrics-grid">
            <StatCard
              title="Assigned Requisitions"
              value={jobs.length}
              subtitle="Active Recruitment Pipelines"
              iconName="recruitment"
              iconBg="#e0f2fe"
              iconColor="#0284c7"
            />
            <StatCard
              title="Total Applications"
              value={candidates.length}
              subtitle="Received CV Submissions"
              iconName="onboarding"
              iconBg="#dcfce7"
              iconColor="#16a34a"
            />
            <StatCard
              title="CV Reviews Required"
              value={candidates.filter(c => c.AIStatus === 'AI_COMPLETED' && c.RecruiterStatus === 'NEW').length}
              subtitle="Awaiting Recruiter Action"
              iconName="dashboard"
              iconBg="#fef3c7"
              iconColor="#d97706"
            />
            <StatCard
              title="Interviews Scheduled"
              value={candidates.filter(c => c.RecruiterStatus?.includes('INTERVIEW')).length}
              subtitle="Active Interview Stages"
              iconName="employees"
              iconBg="#f3e8ff"
              iconColor="#9333ea"
            />
          </div>
        </>
      )}

      {/* --- 5. PAYROLL ADMIN DASHBOARD --- */}
      {role === ROLES.PAYROLL_ADMIN && (
        <>
          <div className="metrics-grid">
            <StatCard
              title="Current Payroll Cycle"
              value={latestPayroll?.MonthYear || 'N/A'}
              subtitle={`Status: ${latestPayroll?.Status || 'DRAFT'}`}
              iconName="payroll"
              iconBg="#dcfce7"
              iconColor="#16a34a"
            />
            <StatCard
              title="Total Gross Payroll"
              value={latestPayroll?.TotalGross ? `$${latestPayroll.TotalGross.toLocaleString()}` : '$0'}
              subtitle={`${latestPayroll?.TotalEmployees || employees.length} Employees Processed`}
              iconName="reports"
              iconBg="#e0f2fe"
              iconColor="#0284c7"
            />
            <StatCard
              title="Payslips Generated"
              value={payrollItems.length}
              subtitle="Synced to Google Drive Storage"
              iconName="onboarding"
              iconBg="#fef3c7"
              iconColor="#d97706"
            />
          </div>
        </>
      )}

      {/* --- 6. TRAINING ADMIN DASHBOARD --- */}
      {role === ROLES.TRAINING_ADMIN && (
        <>
          <div className="metrics-grid">
            <StatCard
              title="Training Programs"
              value={trainingPrograms.length}
              subtitle="Active Workshops & Certifications"
              iconName="training"
              iconBg="#f3e8ff"
              iconColor="#9333ea"
            />
            <StatCard
              title="Total Enrollment"
              value={trainingAssignments.length}
              subtitle="Assigned Employees"
              iconName="employees"
              iconBg="#e0f2fe"
              iconColor="#0284c7"
            />
            <StatCard
              title="Completion Rate"
              value={trainingAssignments.length > 0 ? `${Math.round((trainingAssignments.filter(t => t.Status === 'COMPLETED').length / trainingAssignments.length) * 100)}%` : '0%'}
              subtitle="Course Certifications Completed"
              iconName="performance"
              iconBg="#dcfce7"
              iconColor="#16a34a"
            />
          </div>
        </>
      )}
    </div>
  );
}
