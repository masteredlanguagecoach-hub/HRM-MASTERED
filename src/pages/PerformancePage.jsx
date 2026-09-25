// Performance Management Module Page (KPIs, KRAs, Goals & Performance Appraisals)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, DataTable, TableToolbar, Button, StatusBadge, ContentCard, Modal, FormField, Tabs } from '../components/common/UIComponents.jsx';

export function PerformancePage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('goals'); // 'goals', 'reviews'
  const [searchTerm, setSearchTerm] = useState('');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    EmployeeID: 'EMP-000005',
    GoalTitle: '',
    KPI_KRA: 'KRA: Platform Quality',
    TargetMetric: '',
    DueDate: '',
    ReviewPeriod: '2026-Q3'
  });

  const goals = dbService.getAll('PerformanceGoals', currentUser) || [];
  const employees = dbService.getAll('Employees', currentUser) || [];
  const reviews = dbService.getAll('PerformanceReviews', currentUser) || [];

  const isAdmin = hasPermission('performance.review');

  const filteredGoals = goals.filter(g => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return g.GoalTitle?.toLowerCase().includes(q) || g.KPI_KRA?.toLowerCase().includes(q) || g.EmployeeID?.toLowerCase().includes(q);
  });

  const handleCreateGoal = (e) => {
    e.preventDefault();
    try {
      const empId = isAdmin ? goalForm.EmployeeID : currentUser.EmployeeID;
      dbService.insert('PerformanceGoals', {
        GoalID: 'GOL-' + Date.now(),
        EmployeeID: empId,
        ...goalForm,
        ProgressPercent: 0,
        Status: 'IN_PROGRESS',
        CreatedAt: new Date().toISOString()
      }, currentUser);

      dbService.insert('AuditLogs', {
        AuditID: 'AUD-' + Date.now(),
        UserEmail: currentUser.Email,
        Action: 'CREATE_KPI_KRA',
        Module: 'PERFORMANCE',
        Details: `Created KPI/KRA ${goalForm.GoalTitle} for ${empId}`,
        Timestamp: new Date().toISOString()
      }, currentUser);

      showToast(`KPI/KRA Goal created for ${empId}`, 'success');
      setIsGoalModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateProgress = (goal, newProgress) => {
    try {
      const status = newProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
      dbService.update('PerformanceGoals', 'GoalID', goal.GoalID, {
        ProgressPercent: newProgress,
        Status: status,
        UpdatedAt: new Date().toISOString()
      }, currentUser);

      showToast(`Updated progress for ${goal.GoalTitle} to ${newProgress}%`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="module-view">
      <PageHeader
        title={isAdmin ? 'KPI, KRA & Performance Management' : 'My KPIs & Key Result Areas (KRAs)'}
        subtitle={isAdmin ? 'Define Employee KPIs & KRAs, Track Target Metrics & Performance Reviews' : 'View Assigned KPIs, KRAs, Update Target Progress % & Appraisals'}
        actions={
          <Button variant="primary" icon="performance" onClick={() => setIsGoalModalOpen(true)}>
            Add KPI / KRA Goal
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'goals', label: isAdmin ? 'Organization KPIs & KRAs' : 'My Assigned KPIs & KRAs', icon: 'performance' },
          { id: 'reviews', label: 'Performance Appraisal Reviews', icon: 'reports' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter KPI / KRA goals by title, category, or employee ID..."
      />

      {activeTab === 'goals' && (
        <ContentCard title="KPI & KRA Goal Tracking Matrix">
          <DataTable
            columns={[
              { header: 'Goal ID', accessor: 'GoalID' },
              { header: 'Goal Title', accessor: 'GoalTitle' },
              { header: 'KPI / KRA Category', render: (row) => <strong>{row.KPI_KRA}</strong> },
              { header: 'Employee ID', accessor: 'EmployeeID' },
              { header: 'Target Metric', accessor: 'TargetMetric' },
              { header: 'Due Date', accessor: 'DueDate' },
              { header: 'Progress', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${row.ProgressPercent}%`, height: '100%', background: 'var(--primary-600)' }} />
                  </div>
                  <span>{row.ProgressPercent}%</span>
                </div>
              )},
              { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> },
              { header: 'Actions', render: (row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {row.ProgressPercent < 100 && (
                    <Button variant="secondary" size="sm" icon="check" onClick={() => handleUpdateProgress(row, Math.min(100, (Number(row.ProgressPercent) || 0) + 25))}>
                      +25% Progress
                    </Button>
                  )}
                </div>
              )}
            ]}
            data={filteredGoals}
            emptyMessage="No KPI/KRA performance goals found."
          />
        </ContentCard>
      )}

      {activeTab === 'reviews' && (
        <ContentCard title="Appraisal Reviews & Ratings">
          <DataTable
            columns={[
              { header: 'Review ID', accessor: 'ReviewID' },
              { header: 'Employee ID', accessor: 'EmployeeID' },
              { header: 'Period', accessor: 'ReviewPeriod' },
              { header: 'Self Rating', render: (row) => `${row.SelfRating} / 5` },
              { header: 'Manager Rating', render: (row) => `${row.ManagerRating} / 5` },
              { header: 'Final Score', render: (row) => <strong>{row.FinalRating} / 5</strong> },
              { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> }
            ]}
            data={reviews}
            emptyMessage="No appraisal reviews completed."
          />
        </ContentCard>
      )}

      {/* CREATE KPI / KRA GOAL MODAL */}
      {isGoalModalOpen && (
        <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Define KPI / KRA Performance Goal">
          <form onSubmit={handleCreateGoal}>
            {isAdmin && (
              <FormField label="Assign to Employee" required>
                <select className="form-select" value={goalForm.EmployeeID} onChange={e => setGoalForm({ ...goalForm, EmployeeID: e.target.value })}>
                  {employees.map(emp => (
                    <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FirstName} {emp.LastName} ({emp.EmployeeID})</option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Goal Title" required>
              <input type="text" className="form-input" value={goalForm.GoalTitle} onChange={e => setGoalForm({ ...goalForm, GoalTitle: e.target.value })} required placeholder="e.g. System Performance Optimization" />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="KPI / KRA Category" required>
                <select className="form-select" value={goalForm.KPI_KRA} onChange={e => setGoalForm({ ...goalForm, KPI_KRA: e.target.value })}>
                  <option value="KRA: Key Result Area">KRA: Key Result Area</option>
                  <option value="KPI: Quality Assurance">KPI: Quality Assurance</option>
                  <option value="KPI: Productivity & Delivery">KPI: Productivity & Delivery</option>
                  <option value="KPI: Leadership & Ownership">KPI: Leadership & Ownership</option>
                </select>
              </FormField>

              <FormField label="Review Period" required>
                <input type="text" className="form-input" value={goalForm.ReviewPeriod} onChange={e => setGoalForm({ ...goalForm, ReviewPeriod: e.target.value })} required placeholder="e.g. 2026-Q3" />
              </FormField>
            </div>

            <FormField label="Target Metric / Deliverable" required>
              <textarea className="form-textarea" value={goalForm.TargetMetric} onChange={e => setGoalForm({ ...goalForm, TargetMetric: e.target.value })} required rows={2} placeholder="e.g. Achieve 99.9% uptime & 90% unit test coverage" />
            </FormField>

            <FormField label="Target Due Date" required>
              <input type="date" className="form-input" value={goalForm.DueDate} onChange={e => setGoalForm({ ...goalForm, DueDate: e.target.value })} required />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setIsGoalModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save KPI / KRA Goal</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
