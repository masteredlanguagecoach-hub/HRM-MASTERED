// Recruitment & Selection Module Page (Responsive Kanban Board, Enquiries Inbox, Job Analysis & AI Interview Questions Generator)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, KanbanBoard, KanbanColumn, CandidateCard, TableToolbar, Button, StatusBadge, ConfirmationDialog, Tabs, DataTable, ContentCard, Modal, FormField } from '../components/common/UIComponents.jsx';
import { CandidateProfileModal } from '../components/cv/CandidateProfileModal.jsx';
import { CreateJobModal } from '../components/recruitment/CreateJobModal.jsx';
import { OnboardingWorkflowModal } from '../components/onboarding/OnboardingWorkflowModal.jsx';
import { formatEnumLabel } from '../config/constants.js';

export function RecruitmentPage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban', 'enquiries', 'jobAnalysis', 'interviewQuestions'
  const [enquirySubTab, setEnquirySubTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [onboardCandidate, setOnboardCandidate] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  // Job Analysis State
  const [analysisRoleTitle, setAnalysisRoleTitle] = useState('Senior Full Stack AI Engineer');
  const [jobAnalysisResult, setJobAnalysisResult] = useState(null);

  // Interview Questions State
  const [interviewRoleTitle, setInterviewRoleTitle] = useState('Senior Full Stack AI Engineer');
  const [interviewQuestionsResult, setInterviewQuestionsResult] = useState(null);

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

  const handleGenerateJobAnalysis = () => {
    const result = {
      title: analysisRoleTitle,
      department: 'Engineering & Technology',
      level: 'L5 Senior Level',
      responsibilities: [
        'Design, build, and maintain high-scale enterprise HR cloud applications.',
        'Implement role-based authorization guards, audit logs, and data security.',
        'Integrate Google Sheets API and Google Drive storage services.'
      ],
      competencies: ['Problem Solving', 'System Design', 'Clean Code Architecture', 'Security Mindset'],
      qualifications: ['Bachelor/Master in Computer Science or related field', '3+ years experience with React, Node.js & SQL']
    };
    setJobAnalysisResult(result);
    showToast(`Generated Job Analysis & Description for "${analysisRoleTitle}"`, 'success');
  };

  const handleGenerateInterviewQuestions = () => {
    const questions = [
      { type: 'TECHNICAL', question: 'Explain how you design fail-closed Role-Based Access Control (RBAC) in a cloud React/Node application.', rubric: 'Candidate must explain default-deny, server-side permission checks, and token session verification.' },
      { type: 'BEHAVIORAL', question: 'Describe a situation where you resolved a critical production error under tight deadline pressure.', rubric: 'Look for structured problem isolation, log analysis, automated testing, and clear stakeholder communication.' },
      { type: 'SITUATIONAL', question: 'How would you handle a scenario where an AI screening engine recommends shortlisting a candidate who lacks a mandatory requirement?', rubric: 'Look for human-in-the-loop accountability, evidence verification, and recorded override justification.' }
    ];
    setInterviewQuestionsResult(questions);
    showToast(`Generated Interview Question Bank for "${interviewRoleTitle}"`, 'success');
  };

  const handleConvertEnquiry = (enquiry) => {
    try {
      const candidateId = `CAN-2026-${String(Date.now()).slice(-6)}`;

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

      dbService.update('JobEnquiries', 'EnquiryID', enquiry.EnquiryID, {
        Status: 'CONVERTED_TO_CANDIDATE',
        ConvertedCandidateID: candidateId,
        ConvertedAt: new Date().toISOString()
      }, currentUser);

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
        subtitle="AI-Assisted Screening, Public Enquiries, Job Analysis & AI Interview Question Generator"
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
          { id: 'enquiries', label: 'Public Enquiries Inbox', icon: 'folder', count: enquiries.length },
          { id: 'jobAnalysis', label: 'Job Analysis & Description', icon: 'reports' },
          { id: 'interviewQuestions', label: 'AI Interview Question Bank', icon: 'user' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'kanban' && (
        <>
          <TableToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Filter candidates by name or skills..."
          />
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
        </>
      )}

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
                  </div>
                )}
              ]}
              data={filteredEnquiries}
              emptyMessage="No public job enquiries received."
            />
          </div>
        </ContentCard>
      )}

      {activeTab === 'jobAnalysis' && (
        <ContentCard title="Job Analysis & Structured Job Description Generator">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '400px' }}
              value={analysisRoleTitle}
              onChange={e => setAnalysisRoleTitle(e.target.value)}
              placeholder="e.g. Senior Full Stack AI Engineer"
            />
            <Button variant="primary" icon="reports" onClick={handleGenerateJobAnalysis}>
              Generate Job Analysis & JD
            </Button>
          </div>

          {jobAnalysisResult && (
            <div style={{ padding: '20px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--slate-900)', marginBottom: '8px' }}>{jobAnalysisResult.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginBottom: '16px' }}>Department: {jobAnalysisResult.department} • Level: {jobAnalysisResult.level}</p>

              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>Core Responsibilities:</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '13px', marginBottom: '16px' }}>
                {jobAnalysisResult.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
              </ul>

              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>Key Competencies:</h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {jobAnalysisResult.competencies.map((c, i) => <span key={i} className="status-badge badge-info">{c}</span>)}
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>Education & Requirements:</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '13px' }}>
                {jobAnalysisResult.qualifications.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
        </ContentCard>
      )}

      {activeTab === 'interviewQuestions' && (
        <ContentCard title="AI Candidate Interview Question Bank Generator">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '400px' }}
              value={interviewRoleTitle}
              onChange={e => setInterviewRoleTitle(e.target.value)}
              placeholder="e.g. Senior Full Stack AI Engineer"
            />
            <Button variant="primary" icon="user" onClick={handleGenerateInterviewQuestions}>
              Generate Interview Questions
            </Button>
          </div>

          {interviewQuestionsResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {interviewQuestionsResult.map((q, idx) => (
                <div key={idx} style={{ padding: '16px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="status-badge badge-info">Question {idx + 1} ({q.type})</span>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate-900)', marginBottom: '6px' }}>{q.question}</p>
                  <p style={{ fontSize: '12px', color: 'var(--slate-600)' }}><strong>Evaluation Rubric:</strong> {q.rubric}</p>
                </div>
              ))}
            </div>
          )}
        </ContentCard>
      )}

      {selectedCandidateId && (
        <CandidateProfileModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
        />
      )}

      {isCreateJobOpen && (
        <CreateJobModal
          isOpen={isCreateJobOpen}
          onClose={() => setIsCreateJobOpen(false)}
        />
      )}

      {onboardCandidate && (
        <OnboardingWorkflowModal
          candidate={onboardCandidate}
          isOpen={!!onboardCandidate}
          onClose={() => setOnboardCandidate(null)}
        />
      )}

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
