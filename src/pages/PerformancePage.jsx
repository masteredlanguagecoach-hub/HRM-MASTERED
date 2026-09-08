// Performance Management Module Page (KPIs/KRAs Goals & Performance Appraisals)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, DataTable, TableToolbar, Button, StatusBadge, ContentCard, Modal, FormField } from '../components/common/UIComponents.jsx';

export function PerformancePage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ GoalTitle: '', KPI_KRA: '', TargetMetric: '', DueDate: '' });

  const goals = dbService.getAll('PerformanceGoals', currentUser) || [];
  const reviews = dbService.getAll('PerformanceReviews', currentUser) || [];

  const filteredGoals = goals.filter(g => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return g.GoalTitle?.toLowerCase().includes(q) || g.KPI_KRA?.toLowerCase().includes(q) || g.EmployeeID?.toLowerCase().includes(q);
  });

  const handleCreateGoal = (e) => {
    e.preventDefault();
    try {
      dbService.insert('PerformanceGoals', {
        GoalID: 'GOL-' + Date.now(),
        EmployeeID: currentUser.EmployeeID,
        ReviewPeriod: 'Q3-2026',
        ...goalForm,
        ProgressPercent: 0,
        Status: 'IN_PROGRESS'
      }, currentUser);

      showToast('Performance goal created successfully', 'success');
      setIsGoalModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="module-view">
      <PageHeader
        title={hasPermission('performance.goal.manage.team') ? 'Team Goals & Reviews' : 'My Goals & Reviews'}
        subtitle="Performance Appraisal Framework, KPI Tracking & Employee Reviews"
        actions={
          hasPermission('performance.goal.create.self') && (
            <Button variant="primary" icon="performance" onClick={() => setIsGoalModalOpen(true)}>
              Create Performance Goal
            </Button>
          )
        }
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter performance goals by title, KPI, or employee..."
      />

      <ContentCard title="Performance Goals & OKR Tracking">
        <DataTable
          columns={[
            { header: 'Goal Title', accessor: 'GoalTitle' },
            { header: 'KPI / KRA', accessor: 'KPI_KRA' },
            { header: 'Employee ID', accessor: 'EmployeeID' },
            { header: 'Review Period', accessor: 'ReviewPeriod' },
            { header: 'Due Date', accessor: 'DueDate' },
            { header: 'Progress', render: (row) => <strong>{row.ProgressPercent}%</strong> },
            { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> }
          ]}
          data={filteredGoals}
          emptyMessage="No performance goals found in your permission scope."
        />
      </ContentCard>

      <ContentCard title="Completed Appraisal Reviews">
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

      {/* Create Goal Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Define New Performance Goal">
        <form onSubmit={handleCreateGoal}>
          <FormField label="Goal Title" required>
            <input type="text" className="form-input" value={goalForm.GoalTitle} onChange={e => setGoalForm({ ...goalForm, GoalTitle: e.target.value })} required placeholder="e.g. Implement AI CV Engine" />
          </FormField>

          <FormField label="KPI / Key Result Area" required>
            <input type="text" className="form-input" value={goalForm.KPI_KRA} onChange={e => setGoalForm({ ...goalForm, KPI_KRA: e.target.value })} required placeholder="e.g. Turnaround time reduction" />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Target Metric" required>
              <input type="text" className="form-input" value={goalForm.TargetMetric} onChange={e => setGoalForm({ ...goalForm, TargetMetric: e.target.value })} required placeholder="e.g. 100% accuracy" />
            </FormField>
            <FormField label="Due Date" required>
              <input type="date" className="form-input" value={goalForm.DueDate} onChange={e => setGoalForm({ ...goalForm, DueDate: e.target.value })} required />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsGoalModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Goal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
