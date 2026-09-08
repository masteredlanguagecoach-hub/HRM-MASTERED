// Reports & HR Analytics Module Page (Workforce Analytics & Exportable Summaries)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, StatCard, ContentCard, DataTable, Button, StatusBadge } from '../components/common/UIComponents.jsx';

export function ReportsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useApp();
  const [reportCategory, setReportCategory] = useState('WORKFORCE');

  const employees = dbService.getAll('Employees', currentUser) || [];
  const jobs = dbService.getAll('Jobs', currentUser) || [];
  const candidates = dbService.getAll('Candidates', currentUser) || [];

  return (
    <div className="module-view">
      <PageHeader
        title="HR Analytics & Executive Reports"
        subtitle="Authoritative Data Analytics & Exportable Operational Summaries"
        actions={
          <Button variant="secondary" icon="reports" onClick={() => window.print()}>
            Print Executive Report
          </Button>
        }
      />

      <div className="metrics-grid">
        <StatCard
          title="Total Workforce"
          value={employees.length}
          subtitle="Active Employees"
          iconName="employees"
        />
        <StatCard
          title="Active Requisitions"
          value={jobs.length}
          subtitle="Open Jobs"
          iconName="recruitment"
        />
        <StatCard
          title="Candidate Submissions"
          value={candidates.length}
          subtitle="AI Screened"
          iconName="onboarding"
        />
      </div>

      <ContentCard title="Workforce Department Breakdown">
        <DataTable
          columns={[
            { header: 'Department', accessor: 'DepartmentID' },
            { header: 'Headcount', render: (row) => `${employees.filter(e => e.DepartmentID === row.DepartmentID).length} Members` },
            { header: 'Status', render: () => <StatusBadge status="ACTIVE" /> }
          ]}
          data={[
            { DepartmentID: 'Engineering & Technology (DEP-000001)' },
            { DepartmentID: 'Human Resources & Talent (DEP-000002)' },
            { DepartmentID: 'Finance & Operations (DEP-000004)' }
          ]}
        />
      </ContentCard>
    </div>
  );
}
