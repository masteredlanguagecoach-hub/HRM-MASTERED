// 3-Step Job Creation Wizard & Automatic Job Description Generator (Configurable PUBLIC_CAREERS_BASE_URL)

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { dbService } from '../../services/db/dbService.js';
import { documentTemplates } from '../../services/docGen/documentTemplates.js';
import { Modal, FormField, Button, StatusBadge, SVGIcon } from '../common/UIComponents.jsx';
import { EmailModal } from '../documents/EmailModal.jsx';

export function CreateJobModal({ isOpen, onClose, onJobCreated }) {
  const { currentUser } = useAuth();
  const { showToast } = useApp();

  const [step, setStep] = useState(1);
  const [createdJob, setCreatedJob] = useState(null);
  const [emailModalDoc, setEmailModalDoc] = useState(null);

  const [jobForm, setJobForm] = useState({
    JobTitle: '',
    DepartmentID: 'DEP-000001',
    HiringManagerID: 'EMP-000002',
    PositionsCount: 1,
    Location: 'San Francisco, CA',
    EmploymentType: 'FULL_TIME',
    MinSalary: 100000,
    MaxSalary: 150000,
    RequiredExperience: 3,
    RequiredSkills: 'React, Node.js, SQL, REST APIs',
    PreferredSkills: 'Google Apps Script, AI Integration, Tailwind CSS',
    Education: 'Bachelor of Science in Computer Science or related field',
    Responsibilities: 'Design, develop, and maintain high-scale enterprise HR applications. Integrate Google Sheets and Drive APIs.',
    ClosingDate: '2026-12-31'
  });

  const handleSaveJob = (e) => {
    e.preventDefault();
    try {
      const newJobId = 'JOB-' + String(Date.now()).slice(-6);
      const newJob = {
        JobID: newJobId,
        ...jobForm,
        Status: 'OPEN',
        PostedDate: new Date().toISOString().split('T')[0],
        CreatedBy: currentUser.EmployeeID
      };

      dbService.insert('Jobs', newJob, currentUser);
      setCreatedJob(newJob);
      setStep(3);
      showToast(`Job Requisition ${newJobId} created and published`, 'success');
      if (onJobCreated) onJobCreated(newJob);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDownloadJD = (format) => {
    if (!createdJob) return;
    const htmlContent = documentTemplates.generateDocumentHTML('JOB_DESCRIPTION', createdJob);
    const blob = new Blob([htmlContent], { type: format === 'pdf' ? 'application/pdf' : 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Job_Description_${createdJob.JobID}.${format === 'pdf' ? 'html' : 'doc'}`;
    a.click();
    showToast(`Downloaded Job Description as ${format.toUpperCase()}`, 'success');
  };

  const handleCopyLink = () => {
    if (!createdJob) return;
    const baseUrl = typeof window !== 'undefined' ? (window.PUBLIC_CAREERS_BASE_URL || window.location.origin) : 'https://careers.masteredhrms.com';
    const publicUrl = `${baseUrl}/careers/jobs/${createdJob.JobID}`;
    navigator.clipboard.writeText(publicUrl);
    showToast(`Copied production application URL: ${publicUrl}`, 'success');
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={step === 3 ? `Job Requisition Created: ${createdJob?.JobID}` : "Create New Job Requisition"} maxWidth="720px" footer={
        step < 3 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>Previous</Button>
            ) : (
              <div></div>
            )}
            {step === 1 ? (
              <Button variant="primary" onClick={() => setStep(2)}>Next: Requirements</Button>
            ) : (
              <Button variant="primary" onClick={handleSaveJob}>Review & Publish Job</Button>
            )}
          </div>
        ) : (
          <Button variant="secondary" onClick={onClose}>Done / Close</Button>
        )
      }>
        {/* STEP INDICATOR STRIP */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['1. Job Info', '2. Requirements', '3. Review & Publish'].map((s, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                padding: '8px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                backgroundColor: step === idx + 1 ? 'var(--primary-600)' : 'var(--slate-100)',
                color: step === idx + 1 ? '#ffffff' : 'var(--slate-600)'
              }}
            >
              {s}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <FormField label="Job Title" required>
              <input type="text" className="form-input" value={jobForm.JobTitle} onChange={e => setJobForm({ ...jobForm, JobTitle: e.target.value })} required placeholder="e.g. Senior Full-Stack Engineer" />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Department">
                <select className="form-select" value={jobForm.DepartmentID} onChange={e => setJobForm({ ...jobForm, DepartmentID: e.target.value })}>
                  <option value="DEP-000001">Engineering & Tech</option>
                  <option value="DEP-000002">Human Resources</option>
                  <option value="DEP-000004">Finance & Ops</option>
                </select>
              </FormField>
              <FormField label="Number of Openings">
                <input type="number" className="form-input" value={jobForm.PositionsCount} onChange={e => setJobForm({ ...jobForm, PositionsCount: Number(e.target.value) })} />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Work Location">
                <input type="text" className="form-input" value={jobForm.Location} onChange={e => setJobForm({ ...jobForm, Location: e.target.value })} />
              </FormField>
              <FormField label="Employment Type">
                <select className="form-select" value={jobForm.EmploymentType} onChange={e => setJobForm({ ...jobForm, EmploymentType: e.target.value })}>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="PART_TIME">Part Time</option>
                </select>
              </FormField>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <FormField label="Required Skills" required helpText="Comma-separated skills used by AI Screening engine">
              <input type="text" className="form-input" value={jobForm.RequiredSkills} onChange={e => setJobForm({ ...jobForm, RequiredSkills: e.target.value })} required />
            </FormField>

            <FormField label="Key Responsibilities" required>
              <textarea className="form-textarea" value={jobForm.Responsibilities} onChange={e => setJobForm({ ...jobForm, Responsibilities: e.target.value })} required rows={4} />
            </FormField>

            <FormField label="Education & Qualifications">
              <input type="text" className="form-input" value={jobForm.Education} onChange={e => setJobForm({ ...jobForm, Education: e.target.value })} />
            </FormField>
          </div>
        )}

        {step === 3 && createdJob && (
          <div>
            <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '20px' }}>
              <strong style={{ color: '#15803d', fontSize: '15px' }}>✓ Job Requisition Successfully Published!</strong>
              <p style={{ fontSize: '13px', color: 'var(--slate-700)', marginTop: '4px' }}>
                Configurable public careers application link generated.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button variant="secondary" icon="reports" onClick={() => handleDownloadJD('pdf')}>
                Download JD (PDF)
              </Button>
              <Button variant="secondary" icon="reports" onClick={() => handleDownloadJD('doc')}>
                Download JD (Word)
              </Button>
              <Button variant="secondary" icon="bell" onClick={() => setEmailModalDoc({ name: `Job_Description_${createdJob.JobID}.pdf`, type: 'JOB_DESCRIPTION', recipient: 'careers@masteredhrms.com' })}>
                Email Job Description
              </Button>
              <Button variant="primary" icon="check" onClick={handleCopyLink}>
                Copy Application Link
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {emailModalDoc && (
        <EmailModal
          isOpen={!!emailModalDoc}
          onClose={() => setEmailModalDoc(null)}
          documentName={emailModalDoc.name}
          defaultRecipient={emailModalDoc.recipient}
        />
      )}
    </>
  );
}
