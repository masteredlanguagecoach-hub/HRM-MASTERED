// Side-by-Side Candidate Comparison Matrix Modal

import React from 'react';

export function CandidateComparisonModal({ candidateList, onClose }) {
  if (!candidateList || candidateList.length === 0) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '1000px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Candidate Comparison Matrix ({candidateList.length} Selected)</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div className="modal-body" style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Comparison Criteria</th>
                {candidateList.map(cand => (
                  <th key={cand.CandidateID} style={{ textAlign: 'center' }}>
                    {cand.FullName}<br/>
                    <span style={{ fontSize: '11px', color: 'var(--slate-400)', textTransform: 'none' }}>{cand.CandidateID}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>AI Screening Score</strong></td>
                {candidateList.map(cand => (
                  <td key={cand.CandidateID} style={{ textAlign: 'center', fontSize: '18px', fontWeight: '800', color: 'var(--primary-600)' }}>
                    {cand.AIScore || 0} / 100
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>AI Recommendation</strong></td>
                {candidateList.map(cand => (
                  <td key={cand.CandidateID} style={{ textAlign: 'center' }}>
                    <span className={`badge badge-${(cand.AIRecommendation || 'SHORTLIST').toLowerCase().replace('_', '-')}`}>
                      {cand.AIRecommendation}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Total / Relevant Experience</strong></td>
                {candidateList.map(cand => (
                  <td key={cand.CandidateID} style={{ textAlign: 'center' }}>
                    {cand.TotalExperience} Yrs Total ({cand.RelevantExperience} Yrs Relevant)
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Highest Education</strong></td>
                {candidateList.map(cand => (
                  <td key={cand.CandidateID} style={{ textAlign: 'center' }}>
                    {cand.HighestEducation}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Skills Stack</strong></td>
                {candidateList.map(cand => (
                  <td key={cand.CandidateID} style={{ fontSize: '12px' }}>
                    {cand.Skills}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Certifications</strong></td>
                {candidateList.map(cand => (
                  <td key={cand.CandidateID} style={{ fontSize: '12px' }}>
                    {cand.Certifications || 'None Listed'}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Expected Salary</strong></td>
                {candidateList.map(cand => (
                  <td key={cand.CandidateID} style={{ textAlign: 'center' }}>
                    ${Number(cand.ExpectedSalary || 0).toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Notice Period</strong></td>
                {candidateList.map(cand => (
                  <td key={cand.CandidateID} style={{ textAlign: 'center' }}>
                    {cand.NoticePeriod}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Recruiter Decision</strong></td>
                {candidateList.map(cand => (
                  <td key={cand.CandidateID} style={{ textAlign: 'center', fontWeight: '700' }}>
                    {cand.RecruiterDecision || 'NEW'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
