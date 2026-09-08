// 5-Step Simplified Onboarding & Employee Activation Component

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { dbService } from '../../services/db/dbService.js';
import { documentTemplates } from '../../services/docGen/documentTemplates.js';
import { Modal, FormField, Button, StatusBadge, SVGIcon } from '../common/UIComponents.jsx';
import { EmailModal } from '../documents/EmailModal.jsx';

export function OnboardingWorkflowModal({ candidate, isOpen, onClose, onComplete }) {
  const { currentUser } = useAuth();
  const { showToast } = useApp();

  const [step, setStep] = useState(1);
  const [emailDoc, setEmailDoc] = useState(null);
  const [onboardForm, setOnboardForm] = useState({
    JoiningDate: new Date().toISOString().split('T')[0],
    WorkLocation: 'San Francisco, CA',
    ProbationMonths: 6,
    DepartmentID: 'DEP-000001',
    DesignationID: 'DSG-000005',
    ManagerID: 'EMP-000002',
    BaseSalary: 120000
  });

  const [missingError, setMissingError] = useState(null);

  if (!candidate || !isOpen) return null;

  const handleGenerateDoc = (docType, format) => {
    // Missing Field Check Guard
    const dataForDoc = { ...candidate, ...onboardForm };
    const missingFields = documentTemplates.validateRequiredFields(docType, dataForDoc);

    if (missingFields.length > 0) {
      setMissingError(`${docType.replace(/_/g, ' ')} cannot be generated. Please complete: ${missingFields.join(', ')}.`);
      return;
    }

    setMissingError(null);
    const htmlContent = documentTemplates.generateDocumentHTML(docType, dataForDoc);
    const blob = new Blob([htmlContent], { type: format === 'pdf' ? 'application/pdf' : 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}_${candidate.CandidateID}_${candidate.FullName.replace(/\s+/g, '_')}.${format === 'pdf' ? 'html' : 'doc'}`;
    a.click();

    showToast(`Generated and downloaded ${docType.replace(/_/g, ' ')} (${format.toUpperCase()})`, 'success');
  };

  const handleActivateEmployee = () => {
    try {
      const newEmpId = 'EMP-00' + String(Date.now()).slice(-4);
      dbService.insert('Employees', {
        EmployeeID: newEmpId,
        FirstName: candidate.FullName.split(' ')[0],
        LastName: candidate.FullName.split(' ').slice(1).join(' ') || 'User',
        Email: candidate.Email,
        Phone: candidate.Phone || '555-0192',
        JoiningDate: onboardForm.JoiningDate,
        WorkLocation: onboardForm.WorkLocation,
        DepartmentID: onboardForm.DepartmentID,
        DesignationID: onboardForm.DesignationID,
        ManagerID: onboardForm.ManagerID,
        BaseSalary: onboardForm.BaseSalary,
        Status: 'ACTIVE'
      }, currentUser);

      dbService.update('Candidates', 'CandidateID', candidate.CandidateID, {
        RecruiterStatus: 'JOINED',
        RecruiterDecision: 'HIRED'
      }, currentUser);

      dbService.insert('AuditLogs', {
        AuditID: 'AUD-' + Date.now(),
        UserEmail: currentUser.Email,
        Action: 'EMPLOYEE_ACTIVATED',
        Module: 'ONBOARDING',
        Details: `Activated candidate ${candidate.FullName} into Employee ID ${newEmpId}`,
        Timestamp: new Date().toISOString()
      }, currentUser);

      showToast(`Activated Employee ${newEmpId} (${candidate.FullName}) successfully!`, 'success');
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Onboarding Pipeline: ${candidate.FullName}`} maxWidth="720px" footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Previous</Button>
          ) : (
            <div></div>
          )}
          {step < 5 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>Continue to Step {step + 1}</Button>
          ) : (
            <Button variant="primary" icon="check" onClick={handleActivateEmployee}>Activate Employee Account</Button>
          )}
        </div>
      }>
        {/* STEP STRIP */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {['1. Offer', '2. Emp Info', '3. Letters', '4. Checklist', '5. Activate'].map((s, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                padding: '8px',
                textAlign: 'center',
                fontSize: '11px',
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

        {missingError && (
          <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '16px', color: '#b91c1c', fontSize: '13px' }}>
            <strong>⚠️ Missing Information Guard:</strong> {missingError}
            <div style={{ marginTop: '8px' }}>
              <Button variant="secondary" size="sm" onClick={() => setStep(2)}>Complete Missing Information</Button>
            </div>
          </div>
        )}

        {/* STEP 1: OFFER */}
        {step === 1 && (
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Step 1: Offer Letter Generation</h4>
            <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginBottom: '20px' }}>
              Generate, download, and email the official offer letter for candidate {candidate.FullName}.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button variant="secondary" icon="reports" onClick={() => handleGenerateDoc('OFFER_LETTER', 'pdf')}>
                Download Offer Letter (PDF)
              </Button>
              <Button variant="secondary" icon="reports" onClick={() => handleGenerateDoc('OFFER_LETTER', 'doc')}>
                Download Offer Letter (Word)
              </Button>
              <Button variant="primary" icon="bell" onClick={() => setEmailDoc({ name: `Offer_Letter_${candidate.CandidateID}.pdf`, recipient: candidate.Email })}>
                Email Offer Letter
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: EMPLOYEE INFORMATION */}
        {step === 2 && (
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Step 2: Employee Profile Setup</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Joining Date" required>
                <input type="date" className="form-input" value={onboardForm.JoiningDate} onChange={e => setOnboardForm({ ...onboardForm, JoiningDate: e.target.value })} required />
              </FormField>
              <FormField label="Work Location" required>
                <input type="text" className="form-input" value={onboardForm.WorkLocation} onChange={e => setOnboardForm({ ...onboardForm, WorkLocation: e.target.value })} required />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Annual Base Salary ($)" required>
                <input type="number" className="form-input" value={onboardForm.BaseSalary} onChange={e => setOnboardForm({ ...onboardForm, BaseSalary: Number(e.target.value) })} required />
              </FormField>
              <FormField label="Probation (Months)" required>
                <input type="number" className="form-input" value={onboardForm.ProbationMonths} onChange={e => setOnboardForm({ ...onboardForm, ProbationMonths: Number(e.target.value) })} required />
              </FormField>
            </div>
          </div>
        )}

        {/* STEP 3: APPOINTMENT & DOCUMENTS */}
        {step === 3 && (
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Step 3: Appointment Letter & Agreements</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button variant="secondary" icon="reports" onClick={() => handleGenerateDoc('APPOINTMENT_LETTER', 'pdf')}>
                Appointment Letter (PDF)
              </Button>
              <Button variant="secondary" icon="reports" onClick={() => handleGenerateDoc('APPOINTMENT_LETTER', 'doc')}>
                Appointment Letter (Word)
              </Button>
              <Button variant="secondary" icon="reports" onClick={() => handleGenerateDoc('EMPLOYMENT_AGREEMENT', 'pdf')}>
                Employment Agreement (PDF)
              </Button>
              <Button variant="secondary" icon="reports" onClick={() => handleGenerateDoc('NDA', 'pdf')}>
                Non-Disclosure Agreement (PDF)
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: JOINING CHECKLIST */}
        {step === 4 && (
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Step 4: Pre-Joining IT & HR Checklist</h4>
            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px' }}>
              <div style={{ marginBottom: '8px' }}><input type="checkbox" defaultChecked /> IT Equipment & Laptop Provisioned</div>
              <div style={{ marginBottom: '8px' }}><input type="checkbox" defaultChecked /> Google Workspace Email Account Provisioned</div>
              <div style={{ marginBottom: '8px' }}><input type="checkbox" defaultChecked /> Emergency Contact & Identity Verification</div>
              <div><input type="checkbox" defaultChecked /> Signed Offer & Appointment Letters Uploaded</div>
            </div>
          </div>
        )}

        {/* STEP 5: ACTIVATE EMPLOYEE */}
        {step === 5 && (
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Step 5: Final Account Activation</h4>
            <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '16px' }}>
              <strong style={{ color: '#15803d' }}>Ready for Activation:</strong> Candidate {candidate.FullName} will be converted to an active Employee record with automatic Employee ID generation and audit trail creation.
            </div>
          </div>
        )}
      </Modal>

      {emailDoc && (
        <EmailModal
          isOpen={!!emailDoc}
          onClose={() => setEmailDoc(null)}
          documentName={emailDoc.name}
          defaultRecipient={emailDoc.recipient}
        />
      )}
    </>
  );
}
