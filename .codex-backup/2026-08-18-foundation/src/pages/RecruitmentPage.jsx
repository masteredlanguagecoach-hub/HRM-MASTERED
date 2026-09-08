// Core Recruitment & Automatic AI CV Selection Module

import React, { useState } from 'react';
import { dbService } from '../services/db/dbService.js';
import { driveService } from '../services/drive/driveService.js';
import { cvParser } from '../services/ai/cvParser.js';
import { screeningEngine } from '../services/ai/screeningEngine.js';
import { duplicateDetector } from '../services/automation/duplicateDetector.js';
import { CandidateProfileModal } from '../components/cv/CandidateProfileModal.jsx';
import { CandidateComparisonModal } from '../components/cv/CandidateComparisonModal.jsx';
import { useApp } from '../context/AppContext.jsx';

export function RecruitmentPage() {
  const { showToast, refreshKey, triggerRefresh } = useApp();
  const [viewMode, setViewMode] = useState('RANKED_LIST'); // 'RANKED_LIST' | 'KANBAN' | 'JOBS'
  const [selectedJobId, setSelectedJobId] = useState('JOB-000001');
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    JobTitle: '',
    DepartmentID: 'DEP-000001',
    MinExperience: 3,
    MaxExperience: 7,
    RequiredSkills: '',
    EducationRequirements: 'Bachelor Degree',
    JobDescription: '',
    MandatoryRequirements: ''
  });

  // Candidate Manual Intake Form State
  const [intakeData, setIntakeData] = useState({
    FullName: '',
    Email: '',
    Phone: '',
    Location: '',
    JobID: 'JOB-000001',
    CvFile: null
  });

  const jobs = dbService.getAll('Jobs');
  const candidates = dbService.query('Candidates', c => !selectedJobId || c.JobID === selectedJobId);

  // Recalculate automatic candidate ranking by AI Score
  candidates.sort((a, b) => (b.AIScore || 0) - (a.AIScore || 0));

  const handleCreateJob = async () => {
    if (!newJob.JobTitle) {
      showToast('Please specify Job Title', 'error');
      return;
    }
    const created = await dbService.insert('Jobs', {
      ...newJob,
      Vacancies: 1,
      Status: 'OPEN',
      HiringManagerID: 'EMP-000002',
      RecruiterID: 'EMP-000003'
    });
    showToast(`Created Job Requisition ${created.JobID}`);
    setShowJobModal(false);
    triggerRefresh();
  };

  const handleUploadCvIntake = async (e) => {
    e.preventDefault();
    if (!intakeData.FullName || !intakeData.Email || !intakeData.CvFile) {
      showToast('Please fill Candidate Name, Email and attach CV file', 'error');
      return;
    }

    // Duplicate Check
    const duplicates = duplicateDetector.detectDuplicates(intakeData.Email, intakeData.Phone, intakeData.FullName);
    if (duplicates.length > 0) {
      showToast(`Warning: Candidate ${duplicates[0].fullName} already exists (${duplicates[0].candidateId})`, 'error');
    }

    showToast('Extracting text & uploading CV to Google Drive...', 'info');

    // 1. Upload to Drive
    const driveFile = await driveService.uploadFile(intakeData.CvFile, 'CVs', { fileName: intakeData.CvFile.name });

    // 2. Extract CV Text
    const parsed = await cvParser.extractText(intakeData.CvFile);

    // 3. Create Candidate Record
    const newCand = await dbService.insert('Candidates', {
      JobID: intakeData.JobID,
      FullName: intakeData.FullName,
      Email: intakeData.Email,
      Phone: intakeData.Phone,
      Location: intakeData.Location,
      CurrentCompany: 'Extracted from CV',
      TotalExperience: 5,
      RelevantExperience: 4,
      HighestEducation: 'Bachelor Degree',
      Skills: 'Extracted Skills',
      ResumeDriveFileID: driveFile.DriveFileID,
      ResumeFileName: driveFile.FileName,
      ResumeText: parsed.text,
      ApplicationSource: 'HR_UPLOAD',
      ApplicationDate: new Date().toISOString().split('T')[0],
      AIStatus: 'QUEUED',
      AIScore: 0,
      AIRecommendation: 'PENDING',
      RecruiterStatus: 'NEW',
      RecruiterDecision: 'NEW',
      AssignedRecruiter: 'EMP-000003'
    });

    showToast('Candidate created. Triggering AI CV Screening Engine...');

    // 4. Run AI CV Screening Engine
    await screeningEngine.screenCandidate(newCand.CandidateID, intakeData.JobID);

    showToast(`AI CV Screening Completed for ${newCand.FullName}!`);
    setShowIntakeModal(false);
    triggerRefresh();
  };

  const toggleSelectForCompare = (cand) => {
    if (selectedForCompare.some(c => c.CandidateID === cand.CandidateID)) {
      setSelectedForCompare(selectedForCompare.filter(c => c.CandidateID !== cand.CandidateID));
    } else {
      setSelectedForCompare([...selectedForCompare, cand]);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recruitment & AI CV Screening</h1>
          <p className="page-subtitle">Automatic CV Selection, AI Requirement Match, Weighted Scoring & Recruiter Override</p>
        </div>
        <div className="action-bar">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowJobModal(true)}>+ New Job Requisition</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowIntakeModal(true)}>⚡ Upload CV Intake</button>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--slate-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600' }}>Filter Job:</label>
          <select
            className="form-select"
            style={{ width: '260px' }}
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            <option value="">All Open Jobs ({jobs.length})</option>
            {jobs.map(j => (
              <option key={j.JobID} value={j.JobID}>{j.JobID}: {j.JobTitle}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedForCompare.length >= 2 && (
            <button className="btn btn-success btn-sm" onClick={() => setShowCompareModal(true)}>
              📊 Compare Selected ({selectedForCompare.length})
            </button>
          )}
          <button className={`btn btn-sm ${viewMode === 'RANKED_LIST' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('RANKED_LIST')}>
            🏆 Ranked List
          </button>
          <button className={`btn btn-sm ${viewMode === 'KANBAN' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('KANBAN')}>
            📋 Pipeline Kanban
          </button>
        </div>
      </div>

      {/* Ranked Candidate Table View */}
      {viewMode === 'RANKED_LIST' && (
        <div className="card-table-container">
          <div className="table-header-title">
            <span className="table-title">Automated AI Candidate Ranking ({candidates.length} Applicants)</span>
            <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Sorted automatically by 100-Point Weighted Match Score</span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Select</th>
                <th>Rank</th>
                <th>Candidate Name</th>
                <th>AI Score</th>
                <th>Experience</th>
                <th>AI Recommendation</th>
                <th>Recruiter Decision</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand, idx) => (
                <tr key={cand.CandidateID}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedForCompare.some(c => c.CandidateID === cand.CandidateID)}
                      onChange={() => toggleSelectForCompare(cand)}
                    />
                  </td>
                  <td>
                    <span style={{ fontWeight: '800', color: idx === 0 ? '#d97706' : 'var(--slate-600)' }}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td>
                    <strong>{cand.FullName}</strong><br/>
                    <span style={{ fontSize: '11px', color: 'var(--slate-400)' }}>{cand.Email} • {cand.CandidateID}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-600)' }}>
                      {cand.AIScore || 0} / 100
                    </div>
                  </td>
                  <td>
                    {cand.TotalExperience} Yrs Total<br/>
                    <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>{cand.RelevantExperience} Yrs Relevant</span>
                  </td>
                  <td>
                    <span className={`badge badge-${(cand.AIRecommendation || 'SHORTLIST').toLowerCase().replace('_', '-')}`}>
                      {cand.AIRecommendation}
                    </span>
                  </td>
                  <td>
                    <strong>{cand.RecruiterDecision || 'NEW'}</strong>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setActiveCandidate(cand)}>
                      👁️ Review Analysis
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {activeCandidate && (
        <CandidateProfileModal
          candidate={activeCandidate}
          onClose={() => setActiveCandidate(null)}
          onRefresh={triggerRefresh}
        />
      )}

      {/* Candidate Comparison Modal */}
      {showCompareModal && (
        <CandidateComparisonModal
          candidateList={selectedForCompare}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {/* Upload CV Intake Modal */}
      {showIntakeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Candidate CV Intake</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowIntakeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUploadCvIntake}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Job Opening Requisition</label>
                  <select className="form-select" value={intakeData.JobID} onChange={(e) => setIntakeData({ ...intakeData, JobID: e.target.value })}>
                    {jobs.map(j => <option key={j.JobID} value={j.JobID}>{j.JobID}: {j.JobTitle}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Candidate Full Name</label>
                  <input className="form-input" required value={intakeData.FullName} onChange={(e) => setIntakeData({ ...intakeData, FullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" required value={intakeData.Email} onChange={(e) => setIntakeData({ ...intakeData, Email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={intakeData.Phone} onChange={(e) => setIntakeData({ ...intakeData, Phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Attach CV File (PDF / DOCX / TXT / Image)</label>
                  <input className="form-input" type="file" required onChange={(e) => setIntakeData({ ...intakeData, CvFile: e.target.files[0] })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowIntakeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Process CV & Screen with AI</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Job Requisition Modal */}
      {showJobModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Job Requisition</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowJobModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input className="form-input" value={newJob.JobTitle} onChange={(e) => setNewJob({ ...newJob, JobTitle: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Min Experience (Yrs)</label>
                  <input className="form-input" type="number" value={newJob.MinExperience} onChange={(e) => setNewJob({ ...newJob, MinExperience: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Education Requirement</label>
                  <input className="form-input" value={newJob.EducationRequirements} onChange={(e) => setNewJob({ ...newJob, EducationRequirements: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Required Skills (Comma separated)</label>
                <input className="form-input" value={newJob.RequiredSkills} onChange={(e) => setNewJob({ ...newJob, RequiredSkills: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea className="form-textarea" value={newJob.JobDescription} onChange={(e) => setNewJob({ ...newJob, JobDescription: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowJobModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreateJob}>Save Requisition</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
