// Candidate Profile & AI CV Analysis Review Modal Component

import React, { useState } from 'react';
import { dbService } from '../../services/db/dbService.js';
import { PIPELINE_STAGES } from '../../config/constants.js';

export function CandidateProfileModal({ candidate, onClose, onRefresh }) {
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState('');

  if (!candidate) return null;

  const job = dbService.getById('Jobs', 'JobID', candidate.JobID) || {};
  const screenings = dbService.query('CandidateScreenings', s => s.CandidateID === candidate.CandidateID) || [];
  const latestScreening = screenings[screenings.length - 1] || {};

  let matchedReqs = [];
  let missingReqs = [];
  let unclearReqs = [];
  let strengths = [];
  let weaknesses = [];

  try { matchedReqs = latestScreening.MatchedRequirements ? JSON.parse(latestScreening.MatchedRequirements) : []; } catch (e) {}
  try { missingReqs = latestScreening.MissingRequirements ? JSON.parse(latestScreening.MissingRequirements) : []; } catch (e) {}
  try { unclearReqs = latestScreening.UnclearRequirements ? JSON.parse(latestScreening.UnclearRequirements) : []; } catch (e) {}
  try { strengths = latestScreening.Strengths ? JSON.parse(latestScreening.Strengths) : []; } catch (e) {}
  try { weaknesses = latestScreening.Weaknesses ? JSON.parse(latestScreening.Weaknesses) : []; } catch (e) {}

  const handleDecisionClick = (decision) => {
    const aiRec = candidate.AIRecommendation || '';
    const isOverride = (aiRec === 'STRONG_SHORTLIST' && decision === 'REJECT') ||
                       (aiRec === 'LOW_MATCH' && decision === 'SHORTLIST');

    if (isOverride) {
      setPendingDecision(decision);
      setShowOverrideModal(true);
    } else {
      applyDecision(decision, '');
    }
  };

  const applyDecision = (decision, reason) => {
    let pipelineStage = PIPELINE_STAGES.SHORTLISTED;
    if (decision === 'REJECT') pipelineStage = PIPELINE_STAGES.REJECTED;
    if (decision === 'HOLD') pipelineStage = PIPELINE_STAGES.AI_REVIEWED;
    if (decision === 'MOVE TO INTERVIEW') pipelineStage = PIPELINE_STAGES.INTERVIEW_1;

    dbService.update('Candidates', 'CandidateID', candidate.CandidateID, {
      RecruiterDecision: decision,
      RecruiterStatus: pipelineStage
    });

    if (latestScreening.ScreeningID) {
      dbService.update('CandidateScreenings', 'ScreeningID', latestScreening.ScreeningID, {
        HumanDecision: decision,
        HumanDecisionBy: 'EMP-000003',
        HumanDecisionAt: new Date().toISOString(),
        OverrideReason: reason
      });
    }

    if (onRefresh) onRefresh();
    setShowOverrideModal(false);
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '950px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{candidate.FullName}</h3>
            <p className="page-subtitle">Applied for: {job.JobTitle || 'Open Position'} ({candidate.CandidateID})</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Column: Candidate & CV Text */}
          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--slate-900)' }}>Candidate Overview</h4>
            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
              <p><strong>Email:</strong> {candidate.Email}</p>
              <p><strong>Phone:</strong> {candidate.Phone}</p>
              <p><strong>Location:</strong> {candidate.Location}</p>
              <p><strong>Experience:</strong> {candidate.TotalExperience} Yrs Total ({candidate.RelevantExperience} Yrs Relevant)</p>
              <p><strong>Education:</strong> {candidate.HighestEducation}</p>
              <p><strong>Current Role:</strong> {candidate.CurrentDesignation} at {candidate.CurrentCompany}</p>
              <p><strong>Salary Expectation:</strong> ${Number(candidate.ExpectedSalary || 0).toLocaleString()}</p>
              <p><strong>Notice Period:</strong> {candidate.NoticePeriod}</p>
            </div>

            <h4 style={{ marginBottom: '8px', color: 'var(--slate-900)' }}>Extracted Resume Text</h4>
            <div style={{ background: '#0f172a', color: '#e2e8f0', padding: '14px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '11px', maxHeight: '280px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {candidate.ResumeText || 'No resume text available'}
            </div>
          </div>

          {/* Right Column: AI CV Screening Breakdown */}
          <div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-lg)', padding: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-600)' }}>AI CV SCREENING SCORE</span>
                <span className={`badge badge-${(candidate.AIRecommendation || 'SHORTLIST').toLowerCase().replace('_', '-')}`}>
                  {candidate.AIRecommendation || 'PENDING'}
                </span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '8px' }}>
                {candidate.AIScore || 0} <span style={{ fontSize: '16px', color: 'var(--slate-400)' }}>/ 100</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--slate-600)', lineHeight: '1.4' }}>
                {latestScreening.AIExplanation || 'Candidate evaluated against job requisitions.'}
              </p>
            </div>

            {/* Match Matrix */}
            <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--slate-900)' }}>Requirement Match Matrix</h4>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {(matchedReqs || []).map((m, idx) => (
                <div key={idx} style={{ color: '#15803d' }}>✓ {m}</div>
              ))}
              {(missingReqs || []).map((m, idx) => (
                <div key={idx} style={{ color: '#b91c1c' }}>✗ Missing: {m}</div>
              ))}
              {(unclearReqs || []).map((m, idx) => (
                <div key={idx} style={{ color: '#d97706' }}>? Unclear: {m}</div>
              ))}
            </div>

            {/* Strengths & Weaknesses */}
            {(strengths || []).length > 0 && (
              <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                <strong>Key Strengths:</strong>
                <ul style={{ paddingLeft: '16px', color: 'var(--slate-700)' }}>
                  {(strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Recruiter Actions */}
        <div className="modal-footer">
          <span style={{ marginRight: 'auto', fontSize: '13px', color: 'var(--slate-500)' }}>
            Current Status: <strong>{candidate.RecruiterDecision || 'NEW'}</strong>
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => handleDecisionClick('HOLD')}>Hold</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleDecisionClick('REJECT')}>Reject</button>
          <button className="btn btn-primary btn-sm" onClick={() => handleDecisionClick('SHORTLIST')}>Shortlist</button>
          <button className="btn btn-success btn-sm" onClick={() => handleDecisionClick('MOVE TO INTERVIEW')}>Move to Interview</button>
        </div>

        {/* Override Reason Modal */}
        {showOverrideModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h4 className="modal-title">Recruiter Override Reason Required</h4>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginBottom: '12px' }}>
                  Your decision (<strong>{pendingDecision}</strong>) differs from the AI Recommendation (<strong>{candidate.AIRecommendation}</strong>). Please provide an audit override reason:
                </p>
                <textarea
                  className="form-textarea"
                  placeholder="Enter explicit override justification for audit logs..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowOverrideModal(false)}>Cancel</button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!overrideReason.trim()}
                  onClick={() => applyDecision(pendingDecision, overrideReason)}
                >
                  Save Override & Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
