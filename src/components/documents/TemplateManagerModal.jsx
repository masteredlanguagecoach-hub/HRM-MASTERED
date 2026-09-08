// Document Template Manager Component (Manage Merge Fields, Logos & Header/Footer Templates)

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { Modal, FormField, Button, StatusBadge, DataTable, SVGIcon } from '../common/UIComponents.jsx';

export function TemplateManagerModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { showToast } = useApp();

  const [templates, setTemplates] = useState([
    { id: 'TPL-01', name: 'Standard Offer Letter', category: 'RECRUITMENT', docType: 'OFFER_LETTER', status: 'ACTIVE' },
    { id: 'TPL-02', name: 'Official Appointment Letter', category: 'ONBOARDING', docType: 'APPOINTMENT_LETTER', status: 'ACTIVE' },
    { id: 'TPL-03', name: 'Monthly Payslip Template', category: 'PAYROLL', docType: 'PAYSLIP', status: 'ACTIVE' },
    { id: 'TPL-04', name: 'Relieving & Experience Certificate', category: 'EXIT', docType: 'RELIEVING_LETTER', status: 'ACTIVE' },
    { id: 'TPL-05', name: 'Formal Warning Letter', category: 'EMPLOYMENT', docType: 'WARNING_LETTER', status: 'ACTIVE' }
  ]);

  const [selectedTpl, setSelectedTpl] = useState(null);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="HRMS Document Template Management" maxWidth="760px" footer={
      <Button variant="secondary" onClick={onClose}>Close Template Manager</Button>
    }>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--slate-600)' }}>
          Manage approved HR document templates and dynamic merge fields (`${'${EmployeeName}'}`, `${'${Salary}'}`).
        </p>
        <Button variant="primary" icon="plus" size="sm" onClick={() => showToast('Opened Create Template Form', 'info')}>
          Create Template
        </Button>
      </div>

      <DataTable
        columns={[
          { header: 'Template ID', accessor: 'id' },
          { header: 'Template Name', accessor: 'name' },
          { header: 'Category', accessor: 'category' },
          { header: 'Document Type', accessor: 'docType' },
          { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { header: 'Action', render: (row) => (
            <Button variant="secondary" size="sm" icon="edit" onClick={() => setSelectedTpl(row)}>
              Edit Template
            </Button>
          )}
        ]}
        data={templates}
      />

      {selectedTpl && (
        <div style={{ marginTop: '20px', padding: '16px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>Edit Template: {selectedTpl.name}</h4>
          <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginBottom: '8px' }}>
            Available Merge Fields: <strong>${'${EmployeeName}'}, ${'${EmployeeID}'}, ${'${Department}'}, ${'${JoiningDate}'}, ${'${BaseSalary}'}, ${'${CompanyLogo}'}</strong>
          </div>
          <FormField label="Template Body (HTML / Merge Tokens)">
            <textarea className="form-textarea" rows={4} defaultValue={`<div>Official ${selectedTpl.name} for \${EmployeeName} (\${EmployeeID}). Effective \${JoiningDate}.</div>`} />
          </FormField>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <Button variant="primary" size="sm" onClick={() => { showToast('Template saved successfully', 'success'); setSelectedTpl(null); }}>
              Save Template Changes
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSelectedTpl(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
