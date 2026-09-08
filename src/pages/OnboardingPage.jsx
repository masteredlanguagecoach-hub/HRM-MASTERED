// Employee Onboarding Module Page (New Hire Onboarding Workflows & Task Checklists)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, DataTable, TableToolbar, Button, StatusBadge, ContentCard } from '../components/common/UIComponents.jsx';

export function OnboardingPage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');

  const candidates = dbService.getAll('Candidates', currentUser) || [];
  const onboardingCandidates = candidates.filter(c => c.RecruiterStatus === 'SELECTED' || c.RecruiterStatus === 'OFFER_ACCEPTED' || c.RecruiterStatus === 'SHORTLISTED');

  const filtered = onboardingCandidates.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return c.FullName?.toLowerCase().includes(q) || c.Email?.toLowerCase().includes(q);
  });

  return (
    <div className="module-view">
      <PageHeader
        title="Employee Onboarding Lifecycle"
        subtitle="New Hire Pre-Boarding Tasks, Document Intake & Employee Record Conversion"
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter onboarding candidates..."
      />

      <ContentCard title="Candidates Ready for Employee Conversion">
        <DataTable
          columns={[
            { header: 'Candidate ID', accessor: 'CandidateID' },
            { header: 'Full Name', accessor: 'FullName' },
            { header: 'Email', accessor: 'Email' },
            { header: 'Position ID', accessor: 'JobID' },
            { header: 'Stage', render: (row) => <StatusBadge status={row.RecruiterStatus || 'NEW'} /> },
            { header: 'Action', render: (row) => (
              hasPermission('onboarding.manage') && (
                <Button variant="primary" size="sm" icon="plus" onClick={() => showToast(`Initiated onboarding workflow for ${row.FullName}`, 'success')}>
                  Convert to Employee
                </Button>
              )
            )}
          ]}
          data={filtered}
          emptyMessage="No candidates currently in onboarding pipeline."
        />
      </ContentCard>
    </div>
  );
}
