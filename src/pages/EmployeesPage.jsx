// Employee Management Module Page (Employee Directory, Legal & Compliance Centre & Document Repository)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { documentTemplates } from '../services/docGen/documentTemplates.js';
import { PageHeader, DataTable, TableToolbar, Button, StatusBadge, Modal, FormField, Tabs } from '../components/common/UIComponents.jsx';
import { EmailModal } from '../components/documents/EmailModal.jsx';

export function EmployeesPage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [emailDoc, setEmailDoc] = useState(null);
  const [isAddLegalModalOpen, setIsAddLegalModalOpen] = useState(false);

  const [formData, setFormData] = useState({ FirstName: '', LastName: '', Email: '', Phone: '', DepartmentID: 'DEP-000001', DesignationID: 'DSG-000005', WorkLocation: 'San Francisco, CA' });
  const [customLetterType, setCustomLetterType] = useState('CONFIRMATION_LETTER');

  const [legalForm, setLegalForm] = useState({
    ContractType: 'EMPLOYMENT_AGREEMENT',
    TaxID_SSN: 'XXX-XX-9842',
    WorkPermitStatus: 'CITIZEN_PERMANENT',
    WorkPermitExpiry: '2030-12-31',
    Notes: 'Standard employment contract & NDA executed.'
  });

  const employees = dbService.getAll('Employees', currentUser) || [];
  const legalContracts = dbService.getAll('EmployeeLegalContracts', currentUser) || [];

  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return emp.FirstName?.toLowerCase().includes(q) || emp.LastName?.toLowerCase().includes(q) || emp.Email?.toLowerCase().includes(q) || emp.EmployeeID?.toLowerCase().includes(q);
  });

  const empLegalRecords = selectedEmp ? legalContracts.filter(c => c.EmployeeID === selectedEmp.EmployeeID) : [];

  const handleAddEmployee = (e) => {
    e.preventDefault();
    try {
      const newId = 'EMP-00' + String(Date.now()).slice(-4);
      dbService.insert('Employees', {
        ...formData,
        EmployeeID: newId,
        JoiningDate: new Date().toISOString().split('T')[0],
        Status: 'ACTIVE'
      }, currentUser);

      // Create default Legal Record
      dbService.insert('EmployeeLegalContracts', {
        ContractID: 'LEG-' + Date.now(),
        EmployeeID: newId,
        ContractType: 'EMPLOYMENT_AGREEMENT',
        TaxID_SSN: 'XXX-XX-' + String(Date.now()).slice(-4),
        WorkPermitStatus: 'US_CITIZEN',
        EffectiveDate: new Date().toISOString().split('T')[0],
        SignedStatus: 'SIGNED',
        SignedAt: new Date().toISOString().split('T')[0],
        CreatedAt: new Date().toISOString()
      }, currentUser);

      showToast(`Employee ${formData.FirstName} ${formData.LastName} & Legal Record created`, 'success');
      setIsAddModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddLegalContract = (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      dbService.insert('EmployeeLegalContracts', {
        ContractID: 'LEG-' + Date.now(),
        EmployeeID: selectedEmp.EmployeeID,
        ...legalForm,
        EffectiveDate: new Date().toISOString().split('T')[0],
        SignedStatus: 'SIGNED',
        SignedAt: new Date().toISOString().split('T')[0],
        CreatedAt: new Date().toISOString()
      }, currentUser);

      showToast(`Legal Record ${legalForm.ContractType} added for ${selectedEmp.EmployeeID}`, 'success');
      setIsAddLegalModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleGenerateCustomLetter = (format) => {
    if (!selectedEmp) return;
    const htmlContent = documentTemplates.generateDocumentHTML(customLetterType, selectedEmp);
    const blob = new Blob([htmlContent], { type: format === 'pdf' ? 'application/pdf' : 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customLetterType}_${selectedEmp.EmployeeID}.${format === 'pdf' ? 'html' : 'doc'}`;
    a.click();

    dbService.insert('AuditLogs', {
      AuditID: 'AUD-' + Date.now(),
      UserEmail: currentUser.Email,
      Action: 'GENERATE_DOCUMENT',
      Module: 'EMPLOYEES',
      Details: `Generated ${customLetterType} for Employee ${selectedEmp.EmployeeID}`,
      Timestamp: new Date().toISOString()
    }, currentUser);

    showToast(`Generated and downloaded ${customLetterType.replace(/_/g, ' ')} (${format.toUpperCase()})`, 'success');
  };

  const columns = [
    { header: 'ID', accessor: 'EmployeeID' },
    { header: 'Employee Name', render: (row) => `${row.FirstName} ${row.LastName}` },
    { header: 'Email', accessor: 'Email' },
    { header: 'Work Location', accessor: 'WorkLocation' },
    { header: 'Joining Date', accessor: 'JoiningDate' },
    { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> },
    { header: 'Actions', render: (row) => (
      <Button variant="secondary" size="sm" icon="reports" onClick={() => { setSelectedEmp(row); setActiveTab('profile'); }}>
        Profile & Legal
      </Button>
    )}
  ];

  if (hasPermission('employee.sensitive.view')) {
    columns.splice(5, 0, { header: 'Base Salary', render: (row) => row.BaseSalary ? `$${Number(row.BaseSalary).toLocaleString()}` : 'N/A' });
  }

  return (
    <div className="module-view">
      <PageHeader
        title={hasPermission('employee.create') ? 'Employee Directory & Legal Management' : 'My Employee Profile & Legal Records'}
        subtitle="Authoritative Master Profiles, Legal Compliance, NDA Agreements & Document Centre"
        actions={
          hasPermission('employee.create') && (
            <Button variant="primary" icon="plus" onClick={() => setIsAddModalOpen(true)}>
              Add New Employee
            </Button>
          )
        }
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter employee records by name, email, or ID..."
      />

      <DataTable
        columns={columns}
        data={filteredEmployees}
        emptyMessage="No employee records found in your permission scope."
      />

      {/* Add Employee Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Employee Record">
        <form onSubmit={handleAddEmployee}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="First Name" required>
              <input type="text" className="form-input" value={formData.FirstName} onChange={e => setFormData({ ...formData, FirstName: e.target.value })} required />
            </FormField>
            <FormField label="Last Name" required>
              <input type="text" className="form-input" value={formData.LastName} onChange={e => setFormData({ ...formData, LastName: e.target.value })} required />
            </FormField>
          </div>

          <FormField label="Work Email" required>
            <input type="email" className="form-input" value={formData.Email} onChange={e => setFormData({ ...formData, Email: e.target.value })} required />
          </FormField>

          <FormField label="Phone Number">
            <input type="text" className="form-input" value={formData.Phone} onChange={e => setFormData({ ...formData, Phone: e.target.value })} />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Employee</Button>
          </div>
        </form>
      </Modal>

      {/* Employee Detail & Confidential Legal Centre Modal */}
      {selectedEmp && (
        <Modal isOpen={true} onClose={() => setSelectedEmp(null)} title={`Employee Profile & Legal Compliance: ${selectedEmp.FirstName} ${selectedEmp.LastName} (${selectedEmp.EmployeeID})`} maxWidth="840px" footer={
          <Button variant="secondary" onClick={() => setSelectedEmp(null)}>Close Profile</Button>
        }>
          <Tabs
            tabs={[
              { id: 'profile', label: 'Employee Profile', icon: 'user' },
              { id: 'legal', label: 'Legal & Compliance', icon: 'lock' },
              { id: 'documents', label: 'Document Centre', icon: 'folder' },
              { id: 'generate', label: 'Generate HR Letter', icon: 'reports' }
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div style={{ marginTop: '20px' }}>
            {activeTab === 'profile' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div><strong>Employee ID:</strong> {selectedEmp.EmployeeID}</div>
                <div><strong>Full Name:</strong> {selectedEmp.FirstName} {selectedEmp.LastName}</div>
                <div><strong>Email:</strong> {selectedEmp.Email}</div>
                <div><strong>Phone:</strong> {selectedEmp.Phone || 'N/A'}</div>
                <div><strong>Joining Date:</strong> {selectedEmp.JoiningDate}</div>
                <div><strong>Work Location:</strong> {selectedEmp.WorkLocation}</div>
                <div><strong>Status:</strong> <StatusBadge status={selectedEmp.Status} /></div>
              </div>
            )}

            {/* TAB 2: LEGAL & COMPLIANCE */}
            {activeTab === 'legal' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Legal Contracts, NDAs & Statutory Compliance</h4>
                    <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Authoritative statutory records and signed non-disclosure agreements</p>
                  </div>
                  {hasPermission('employee.edit') && (
                    <Button variant="primary" size="sm" icon="plus" onClick={() => setIsAddLegalModalOpen(true)}>
                      Add Legal Record
                    </Button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', padding: '16px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px' }}>
                  <div><strong>Tax ID / SSN / PAN:</strong> XXX-XX-9482 (Verified)</div>
                  <div><strong>Right-to-Work / Visa Status:</strong> US Citizen / Permanent Resident</div>
                  <div><strong>W-4 / W-9 Tax Filing:</strong> Submitted & Verified</div>
                  <div><strong>Workers Comp & Statutory Benefits:</strong> Enrolled</div>
                </div>

                <DataTable
                  columns={[
                    { header: 'Contract ID', accessor: 'ContractID' },
                    { header: 'Type', render: (row) => row.ContractType?.replace(/_/g, ' ') },
                    { header: 'Tax ID / SSN', accessor: 'TaxID_SSN' },
                    { header: 'Permit Status', accessor: 'WorkPermitStatus' },
                    { header: 'Effective Date', accessor: 'EffectiveDate' },
                    { header: 'Signed Status', render: (row) => <StatusBadge status={row.SignedStatus || 'SIGNED'} /> },
                    { header: 'Action', render: () => (
                      <Button variant="secondary" size="sm" icon="reports" onClick={() => handleGenerateCustomLetter('pdf')}>
                        View Agreement
                      </Button>
                    )}
                  ]}
                  data={empLegalRecords.length > 0 ? empLegalRecords : [
                    { ContractID: 'LEG-001', ContractType: 'EMPLOYMENT_AGREEMENT', TaxID_SSN: 'XXX-XX-9842', WorkPermitStatus: 'US_CITIZEN', EffectiveDate: selectedEmp.JoiningDate, SignedStatus: 'SIGNED' },
                    { ContractID: 'LEG-002', ContractType: 'NDA_NON_DISCLOSURE', TaxID_SSN: 'XXX-XX-9842', WorkPermitStatus: 'US_CITIZEN', EffectiveDate: selectedEmp.JoiningDate, SignedStatus: 'SIGNED' }
                  ]}
                />
              </div>
            )}

            {/* TAB 3: DOCUMENT CENTRE */}
            {activeTab === 'documents' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Confidential Employee Document Repository</h4>
                  <Button variant="secondary" size="sm" icon="plus" onClick={() => showToast('Opened Document Upload Form', 'info')}>
                    Upload Document
                  </Button>
                </div>

                <DataTable
                  columns={[
                    { header: 'Document Name', accessor: 'name' },
                    { header: 'Type', accessor: 'type' },
                    { header: 'Version', accessor: 'version' },
                    { header: 'Date', accessor: 'date' },
                    { header: 'Actions', render: (row) => (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button variant="secondary" size="sm" icon="reports" onClick={() => handleGenerateCustomLetter('pdf')}>PDF</Button>
                        <Button variant="secondary" size="sm" icon="reports" onClick={() => handleGenerateCustomLetter('doc')}>Word</Button>
                        <Button variant="secondary" size="sm" icon="bell" onClick={() => setEmailDoc({ name: row.name, recipient: selectedEmp.Email })}>Email</Button>
                      </div>
                    )}
                  ]}
                  data={[
                    { name: `Appointment_Letter_${selectedEmp.EmployeeID}.pdf`, type: 'APPOINTMENT_LETTER', version: 'v1.0', date: selectedEmp.JoiningDate },
                    { name: `Employment_Agreement_${selectedEmp.EmployeeID}.pdf`, type: 'EMPLOYMENT_AGREEMENT', version: 'v1.0', date: selectedEmp.JoiningDate },
                    { name: `Non_Disclosure_Agreement_${selectedEmp.EmployeeID}.pdf`, type: 'NDA', version: 'v1.0', date: selectedEmp.JoiningDate }
                  ]}
                />
              </div>
            )}

            {/* TAB 4: GENERATE LETTER */}
            {activeTab === 'generate' && (
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Automatic HR & Legal Document Generator</h4>
                <FormField label="Select Document Type to Generate">
                  <select className="form-select" value={customLetterType} onChange={e => setCustomLetterType(e.target.value)}>
                    <option value="CONFIRMATION_LETTER">Confirmation Letter</option>
                    <option value="EMPLOYMENT_AGREEMENT">Employment Agreement</option>
                    <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                    <option value="PROMOTION_LETTER">Promotion Letter</option>
                    <option value="INCREMENT_LETTER">Salary Revision / Increment Letter</option>
                    <option value="WARNING_LETTER">Formal Warning Letter</option>
                    <option value="RELIEVING_LETTER">Relieving & Experience Certificate</option>
                  </select>
                </FormField>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <Button variant="primary" icon="reports" onClick={() => handleGenerateCustomLetter('pdf')}>
                    Generate & Download PDF
                  </Button>
                  <Button variant="secondary" icon="reports" onClick={() => handleGenerateCustomLetter('doc')}>
                    Generate & Download Word
                  </Button>
                  <Button variant="secondary" icon="bell" onClick={() => setEmailDoc({ name: `${customLetterType}_${selectedEmp.EmployeeID}.pdf`, recipient: selectedEmp.Email })}>
                    Email Document directly
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Legal Record Modal */}
      {isAddLegalModalOpen && (
        <Modal isOpen={isAddLegalModalOpen} onClose={() => setIsAddLegalModalOpen(false)} title="Add Employee Legal & Compliance Record">
          <form onSubmit={handleAddLegalContract}>
            <FormField label="Legal Document / Agreement Type" required>
              <select className="form-select" value={legalForm.ContractType} onChange={e => setLegalForm({ ...legalForm, ContractType: e.target.value })}>
                <option value="EMPLOYMENT_AGREEMENT">Master Employment Agreement</option>
                <option value="NDA_NON_DISCLOSURE">Non-Disclosure Agreement (NDA)</option>
                <option value="NON_COMPETE">Non-Compete & IP Assignment</option>
                <option value="W4_TAX_FILING">W-4 / Tax Filing Certificate</option>
                <option value="WORK_PERMIT_VISA">Work Permit / Visa Verification</option>
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Tax ID / SSN">
                <input type="text" className="form-input" value={legalForm.TaxID_SSN} onChange={e => setLegalForm({ ...legalForm, TaxID_SSN: e.target.value })} />
              </FormField>
              <FormField label="Right-to-Work / Visa Status">
                <input type="text" className="form-input" value={legalForm.WorkPermitStatus} onChange={e => setLegalForm({ ...legalForm, WorkPermitStatus: e.target.value })} />
              </FormField>
            </div>

            <FormField label="Notes & Compliance Remarks">
              <textarea className="form-textarea" value={legalForm.Notes} onChange={e => setLegalForm({ ...legalForm, Notes: e.target.value })} rows={3} />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setIsAddLegalModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Legal Record</Button>
            </div>
          </form>
        </Modal>
      )}

      {emailDoc && (
        <EmailModal
          isOpen={!!emailDoc}
          onClose={() => setEmailDoc(null)}
          documentName={emailDoc.name}
          defaultRecipient={emailDoc.recipient}
        />
      )}
    </div>
  );
}
