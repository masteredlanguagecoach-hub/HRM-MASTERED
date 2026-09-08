// Candidate Profile & Decision Modal Component (Stitch UI Components & Permission Guarded Actions)

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { dbService } from '../../services/db/dbService.js';
import { screeningEngine } from '../../services/ai/screeningEngine.js';
import { Modal, Tabs, Button, StatusBadge, ConfirmationDialog, SVGIcon } from '../common/UIComponents.jsx';
import { formatEnumLabel } from '../../config/constants.js';

export function CandidateProfileModal({ candidateId, jobId, onClose, onRefresh }) {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [isScreening, setIsScreening] = useState(false);
  const [confirmState, setConfirmState] = useState(null); // { type, newStatus, title, message }

  const candidate = dbService.getById('Candidates', 'CandidateID', candidateId, currentUser);
  const job = dbService.getById('Jobs', 'JobID', jobId || candidate?.JobID, currentUser);

  if (!candidate) return null;

  const canShortlist = hasPermission('recruitment.shortlist');
  const canReject = hasPermission('recruitment.reject');
  const canMoveInterview = hasPermission('recruitment.interview.move');
  const canSelect = hasPermission('recruitment.select');
  const canScreen = hasPermission('recruitment.screen');

  const requestDecision = (decisionType, newStatus) => {
    let title = 'Confirm Decision';
    let message = `Are you sure you want to proceed with this hiring action for ${candidate.FullName}? AI recommendation is "${formatEnumLabel(candidate.AIRecommendation)}".`;

    if (decisionType === 'SHORTLIST') {
      if (!canShortlist) return showToast('Access Denied: Lacks recruitment.shortlist permission', 'error');
      title = 'Shortlist Candidate';
    } else if (decisionType === 'REJECT') {
      if (!canReject) return showToast('Access Denied: Lacks recruitment.reject permission', 'error');
      title = 'Reject Candidate';
      message = `Are you sure you want to reject ${candidate.FullName}? The candidate will be notified and logged into AuditLogs.`;
    } else if (decisionType === 'INTERVIEW') {
      if (!canMoveInterview) return showToast('Access Denied: Lacks recruitment.interview.move permission', 'error');
      title = 'Move Candidate to Interview Stage';
    } else if (decisionType === 'SELECT') {
      if (!canSelect) return showToast('Access Denied: Lacks recruitment.select permission', 'error');
      title = 'Final Hire Confirmation';
      message = `Are you sure you want to issue a final offer/hire for ${candidate.FullName}? Human recruiter signature (${currentUser.EmployeeID}) will be recorded.`;
    }

    setConfirmState({ type: decisionType, newStatus, title, message });
  };

  const executeDecision = () => {
    if (!confirmState) return;
    const { type, newStatus } = confirmState;

    try {
      dbService.update('Candidates', 'CandidateID', candidateId, {
        RecruiterStatus: newStatus,
        RecruiterDecision: type,
        HumanDecisionBy: currentUser.EmployeeID,
        UpdatedAt: new Date().toISOString()
      }, currentUser);

      showToast(`Candidate status updated to ${formatEnumLabel(newStatus)}`, 'success');
      if (onRefresh) onRefresh();
      onClose();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleRunScreening = async () => {
    if (!canScreen) {
      showToast('Access Denied: Lacks recruitment.screen permission', 'error');
      return;
    }
    setIsScreening(true);
    try {
      await screeningEngine.screenCandidate(candidateId, job?.JobID || candidate.JobID);
      showToast('AI CV Screening completed successfully', 'success');
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast(`Screening failed: ${e.message}`, 'error');
    } finally {
      setIsScreening(false);
    }
  };

  const tabsConfig = [
    { id: 'overview', label: 'Candidate Profile', icon: 'user' },
    { id: 'ai', label: 'AI Screening Analysis', icon: 'recruitment' },
    { id: 'resume', label: 'Extracted Resume Text', icon: 'reports' }
  ];

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={`Candidate Profile: ${candidate.FullName}`} maxWidth="780px" footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '13px', color: 'var(--slate-600)' }}>
            Stage: <StatusBadge status={candidate.RecruiterStatus || 'NEW'} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {canReject && (
              <Button variant="danger" onClick={() => requestDecision('REJECT', 'REJECTED')}>Reject</Button>
            )}
            {canShortlist && (
              <Button variant="secondary" onClick={() => requestDecision('SHORTLIST', 'SHORTLISTED')}>Shortlist</Button>
            )}
            {canMoveInterview && (
              <Button variant="primary" onClick={() => requestDecision('INTERVIEW', 'INTERVIEW_1')}>Move to Interview</Button>
            )}
            {canSelect && (
              <Button variant="primary" onClick={() => requestDecision('SELECT', 'SELECTED')}>Final Hire</Button>
            )}
          </div>
        </div>
      }>
        <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />

        <div style={{ marginTop: '20px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div><strong>Email:</strong> {candidate.Email}</div>
              <div><strong>Phone:</strong> {candidate.Phone}</div>
              <div><strong>Location:</strong> {candidate.Location}</div>
              <div><strong>Current Company:</strong> {candidate.CurrentCompany || 'N/A'}</div>
              <div><strong>Total Experience:</strong> {candidate.TotalExperience} Years</div>
              <div><strong>Highest Education:</strong> {candidate.HighestEducation || 'N/A'}</div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Skills:</strong> {candidate.Skills}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '16px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: candidate.AIScore >= 80 ? 'var(--emerald-600)' : 'var(--amber-500)' }}>
                    {candidate.AIScore || 0} / 100
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '2px' }}>
                    AI Recommendation: <strong>{formatEnumLabel(candidate.AIRecommendation)}</strong>
                  </div>
                </div>

                {canScreen && (
                  <Button variant="primary" icon="sync" onClick={handleRunScreening} disabled={isScreening}>
                    {isScreening ? 'Running Engine...' : 'Re-Run AI Engine'}
                  </Button>
                )}
              </div>

              <div style={{ fontSize: '13px', color: 'var(--slate-600)', lineHeight: '1.6' }}>
                <strong>AI Policy Safeguard:</strong> The AI Engine scores and explains candidate relevance based on weighted job criteria. Human recruiters must review and confirm every hiring action.
              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <pre style={{ background: 'var(--slate-900)', color: 'var(--slate-100)', padding: '16px', borderRadius: '8px', fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
              {candidate.ResumeText || 'No extracted resume text available'}
            </pre>
          )}
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      {confirmState && (
        <ConfirmationDialog
          isOpen={!!confirmState}
          onClose={() => setConfirmState(null)}
          onConfirm={executeDecision}
          title={confirmState.title}
          message={confirmState.message}
          confirmVariant={confirmState.type === 'REJECT' ? 'danger' : 'primary'}
        />
      )}
    </>
  );
}
