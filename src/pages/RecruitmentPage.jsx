// Recruitment & Selection Module Page (Responsive Kanban Board, Enquiries Inbox & Convert to Candidate Pipeline)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, KanbanBoard, KanbanColumn, CandidateCard, TableToolbar, Button, StatusBadge, ConfirmationDialog, Tabs, DataTable, ContentCard, SVGIcon } from '../components/common/UIComponents.jsx';
import { CandidateProfileModal } from '../components/cv/CandidateProfileModal.jsx';
import { CreateJobModal } from '../components/recruitment/CreateJobModal.jsx';
import { OnboardingWorkflowModal } from '../components/onboarding/OnboardingWorkflowModal.jsx';
import { formatEnumLabel } from '../config/constants.js';

export function RecruitmentPage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban', 'enquiries'
  const [enquirySubTab, setEnquirySubTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [onboardCandidate, setOnboardCandidate] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const jobs = dbService.getAll('Jobs', currentUser) || [];
  const candidates = dbService.getAll('Candidates', currentUser) || [];
  const enquiries = dbService.getAll('JobEnquiries', currentUser) || [];

  const filteredCandidates = candidates.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return c.FullName?.toLowerCase().includes(q) || c.JobID?.toLowerCase().includes(q) || c.Skills?.toLowerCase().includes(q);
  });

  const filteredEnquiries = enquiries.filter(e => {
    const matchesSearch = !searchTerm || e.FullName?.toLowerCase().includes(searchTerm.toLowerCase()) || e.EnquiryID?.toLowerCase().includes(searchTerm.toLowerCase()) || e.Skills?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSub = enquirySubTab === 'ALL' || e.Status === enquirySubTab;
    return matchesSearch && matchesSub;
  });

  const getStageCandidates = (stageFilter) => {
    return filteredCandidates.filter(c => {
      const status = (c.RecruiterStatus || 'NEW').toUpperCase();
      if (stageFilter === 'NEW') return status === 'NEW' || status === 'RECEIVED';
      if (stageFilter === 'AI_REVIEW') return status === 'AI_COMPLETED';
      if (stageFilter === 'HUMAN_REVIEW') return status === 'MANUAL_REVIEW';
      if (stageFilter === 'SHORTLISTED') return status === 'SHORTLISTED';
      if (stageFilter === 'INTERVIEW') return status.includes('INTERVIEW');
      if (stageFilter === 'SELECTED') return status === 'SELECTED' || status === 'OFFER_SENT' || status === 'OFFER_ACCEPTED';
      if (stageFilter === 'REJECTED') return status === 'REJECTED';
      return false;
    });
  };

  const handleConvertEnquiry = (enquiry) => {
    try {
      const candidateId = `CAN-2026-${String(Date.now()).slice(-6)}`;

      // 1. Insert Candidate record
      dbService.insert('Candidates', {
        CandidateID: candidateId,
        JobID: enquiry.JobID !== 'N/A' ? enquiry.JobID : 'JOB-000001',
        FullName: enquiry.FullName,
        Email: enquiry.Email,
        Phone: enquiry.Phone,
        Location: enquiry.CurrentLocation,
        CurrentCompany: enquiry.CurrentCompany,
        CurrentDesignation: enquiry.CurrentDesignation,
        TotalExperience: enquiry.TotalExperience,
        HighestEducation: enquiry.HighestEducation,
        Skills: enquiry.Skills,
        ResumeDriveFileID: enquiry.ResumeDriveFileID,
        ResumeFileName: enquiry.ResumeFileName,
        ApplicationSource: enquiry.ApplicationSource || 'Careers Enquiry',
        ApplicationDate: new Date().toISOString().split('T')[0],
        AIStatus: 'AI_COMPLETED',
        AIScore: 85,
        AIRecommendation: 'STRONG_SHORTLIST',
        RecruiterStatus: 'NEW',
        CreatedAt: new Date().toISOString()
      }, currentUser);

      // 2. Update Enquiry Record
      dbService.update('JobEnquiries', 'EnquiryID', enquiry.EnquiryID, {
        Status: 'CONVERTED_TO_CANDIDATE',
        ConvertedCandidateID: candidateId,
        ConvertedAt: new Date().toISOString()
      }, currentUser);

      // 3. Log Audit
      dbService.insert('AuditLogs', {
        AuditID: 'AUD-' + Date.now(),
        UserEmail: currentUser.Email,
        Action: 'CONVERT_ENQUIRY_TO_CANDIDATE',
        Module: 'RECRUITMENT',
        Details: `Converted Enquiry ${enquiry.EnquiryID} into Candidate ${candidateId}`,
        Timestamp: new Date().toISOString()
      }, currentUser);

      showToast(`Enquiry ${enquiry.EnquiryID} converted to Candidate ${candidateId}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRequestAction = (candidate, decision) => {
    let newStatus = 'SHORTLISTED';
    let title = 'Shortlist Candidate';
    let message = `Are you sure you want to shortlist ${candidate.FullName}? AI recommendation is "${formatEnumLabel(candidate.AIRecommendation)}". Final hiring decisions require human recruiter confirmation.`;

    if (decision === 'REJECT') {
      newStatus = 'REJECTED';
      title = 'Reject Candidate';
      message = `Are you sure you want to reject ${candidate.FullName}? AI recommendation is "${formatEnumLabel(candidate.AIRecommendation)}". Authorized human decision will be recorded into AuditLogs.`;
    }

    setConfirmState({ candidate, decision, newStatus, title, message });
  };

  const handleConfirmDecision = () => {
    if (!confirmState) return;
    const { candidate, decision, newStatus } = confirmState;

    try {
      dbService.update('Candidates', 'CandidateID', candidate.CandidateID, {
        RecruiterStatus: newStatus,
        RecruiterDecision: decision,
        HumanDecisionBy: currentUser.EmployeeID,
        UpdatedAt: new Date().toISOString()
      }, currentUser);

      showToast(`Recorded human ${decision.toLowerCase()} decision for ${candidate.FullName}`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="module-view">
      <PageHeader
        title="Recruitment & Selection Management"
        subtitle="AI-Assisted CV Screening Engine, Public Enquiries Inbox & Candidate Hiring Pipeline"
        actions={
          hasPermission('recruitment.create') && (
            <Button variant="primary" icon="plus" onClick={() => setIsCreateJobOpen(true)}>
              Create Job Requisition
            </Button>
          )
        }
      />

      <Tabs
        tabs={[
          { id: 'kanban', label: 'Candidate Hiring Pipeline', icon: 'recruitment', count: candidates.length },
          { id: 'enquiries', label: 'Public Enquiries Inbox', icon: 'folder', count: enquiries.length }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder={activeTab === 'kanban' ? "Filter candidates by name or skills..." : "Filter public enquiries..."}
      />

      {/* VIEW 1: KANBAN PIPELINE */}
      {activeTab === 'kanban' && (
        <KanbanBoard>
          <KanbanColumn title="New CV" count={getStageCandidates('NEW').length} badgeColor="var(--slate-500)">
            {getStageCandidates('NEW').map(c => (
              <CandidateCard key={c.CandidateID} candidate={c} onClick={cand => setSelectedCandidateId(cand.CandidateID)} onAction={handleRequestAction} />
            ))}
          </KanbanColumn>

          <KanbanColumn title="AI Review" count={getStageCandidates('AI_REVIEW').length} badgeColor="#0284c7">
            {getStageCandidates('AI_REVIEW').map(c => (
              <CandidateCard key={c.CandidateID} candidate={c} onClick={cand => setSelectedCandidateId(cand.CandidateID)} onAction={handleRequestAction} />
            ))}
          </KanbanColumn>

          <KanbanColumn title="Human Review" count={getStageCandidates('HUMAN_REVIEW').length} badgeColor="#f59e0b">
            {getStageCandidates('HUMAN_REVIEW').map(c => (
              <CandidateCard key={c.CandidateID} candidate={c} onClick={cand => setSelectedCandidateId(cand.CandidateID)} onAction={handleRequestAction} />
            ))}
          </KanbanColumn>

          <KanbanColumn title="Shortlisted" count={getStageCandidates('SHORTLISTED').length} badgeColor="#d97706">
            {getStageCandidates('SHORTLISTED').map(c => (
              <CandidateCard key={c.CandidateID} candidate={c} onClick={cand => setSelectedCandidateId(cand.CandidateID)} onAction={handleRequestAction} />
            ))}
          </KanbanColumn>

          <KanbanColumn title="Interview" count={getStageCandidates('INTERVIEW').length} badgeColor="#9333ea">
            {getStageCandidates('INTERVIEW').map(c => (
              <CandidateCard key={c.CandidateID} candidate={c} onClick={cand => setSelectedCandidateId(cand.CandidateID)} onAction={handleRequestAction} />
            ))}
          </KanbanColumn>

          <KanbanColumn title="Selected / Hired" count={getStageCandidates('SELECTED').length} badgeColor="#16a34a">
            {getStageCandidates('SELECTED').map(c => (
              <CandidateCard key={c.CandidateID} candidate={c} onClick={cand => setOnboardCandidate(cand)} />
            ))}
          </KanbanColumn>

          <KanbanColumn title="Rejected" count={getStageCandidates('REJECTED').length} badgeColor="#dc2626">
            {getStageCandidates('REJECTED').map(c => (
              <CandidateCard key={c.CandidateID} candidate={c} onClick={cand => setSelectedCandidateId(cand.CandidateID)} />
            ))}
          </KanbanColumn>
        </KanbanBoard>
      )}

      {/* VIEW 2: ENQUIRIES INBOX */}
      {activeTab === 'enquiries' && (
        <ContentCard title="Public Careers Submissions & Talent Pool Enquiries">
          <Tabs
            tabs={[
              { id: 'ALL', label: 'All Submissions' },
              { id: 'NEW', label: 'New' },
              { id: 'TALENT_POOL', label: 'Talent Pool' },
              { id: 'CONVERTED_TO_CANDIDATE', label: 'Converted' }
            ]}
            activeTab={enquirySubTab}
            onChange={setEnquirySubTab}
          />

          <div style={{ marginTop: '16px' }}>
            <DataTable
              columns={[
                { header: 'Enquiry Ref ID', accessor: 'EnquiryID' },
                { header: 'Type', render: (row) => formatEnumLabel(row.EnquiryType) },
                { header: 'Candidate Name', accessor: 'FullName' },
                { header: 'Email', accessor: 'Email' },
                { header: 'Target Job / Role', render: (row) => row.JobID !== 'N/A' ? row.JobID : (row.PreferredRole || 'Talent Pool') },
                { header: 'Experience', render: (row) => `${row.TotalExperience || 0} Yrs` },
                { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> },
                { header: 'Actions', render: (row) => (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {row.Status !== 'CONVERTED_TO_CANDIDATE' && (
                      <Button variant="primary" size="sm" icon="check" onClick={() => handleConvertEnquiry(row)}>
                        Convert to Candidate
                      </Button>
                    )}
                    {row.ResumeFileName && (
                      <Button variant="secondary" size="sm" icon="reports" onClick={() => showToast(`Opening Drive file: ${row.ResumeFileName}`, 'info')}>
                        View CV
                      </Button>
                    )}
                  </div>
                )}
              ]}
              data={filteredEnquiries}
              emptyMessage="No public job enquiries received."
            />
          </div>
        </ContentCard>
      )}

      {/* Candidate Profile Modal */}
      {selectedCandidateId && (
        <CandidateProfileModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
        />
      )}

      {/* 3-Step Job Creation Wizard */}
      {isCreateJobOpen && (
        <CreateJobModal
          isOpen={isCreateJobOpen}
          onClose={() => setIsCreateJobOpen(false)}
        />
      )}

      {/* 5-Step Onboarding Workflow Modal */}
      {onboardCandidate && (
        <OnboardingWorkflowModal
          candidate={onboardCandidate}
          isOpen={!!onboardCandidate}
          onClose={() => setOnboardCandidate(null)}
        />
      )}

      {/* Human Decision Confirmation Dialog */}
      {confirmState && (
        <ConfirmationDialog
          isOpen={!!confirmState}
          onClose={() => setConfirmState(null)}
          onConfirm={handleConfirmDecision}
          title={confirmState.title}
          message={confirmState.message}
          confirmVariant={confirmState.decision === 'REJECT' ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
}
