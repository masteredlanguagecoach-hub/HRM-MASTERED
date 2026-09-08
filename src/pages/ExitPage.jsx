// Exit Management Module Page (Resignation Requests, Department Clearances & Relieving Certificates)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, DataTable, TableToolbar, Button, StatusBadge, ContentCard, Modal, FormField } from '../components/common/UIComponents.jsx';

export function ExitPage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitForm, setExitForm] = useState({ ResignationDate: new Date().toISOString().split('T')[0], NoticePeriodDays: 30, RequestedLastWorkingDay: '', Reason: '' });

  const exitRequests = dbService.getAll('ExitRequests', currentUser) || [];

  const filteredRequests = exitRequests.filter(e => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return e.EmployeeID?.toLowerCase().includes(q) || e.Reason?.toLowerCase().includes(q) || e.Status?.toLowerCase().includes(q);
  });

  const handleSubmitResignation = (e) => {
    e.preventDefault();
    try {
      dbService.insert('ExitRequests', {
        ExitRequestID: 'EXT-' + Date.now(),
        EmployeeID: currentUser.EmployeeID,
        ...exitForm,
        Status: 'PENDING'
      }, currentUser);

      showToast('Resignation request submitted to HR Management', 'success');
      setIsExitModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="module-view">
      <PageHeader
        title={hasPermission('exit.process') ? 'Exit Management & Clearances' : 'Resignation & Exit'}
        subtitle="Department Clearance Checklists, Final Settlements & Experience Certificates"
        actions={
          hasPermission('exit.self.create') && (
            <Button variant="primary" icon="exit" onClick={() => setIsExitModalOpen(true)}>
              Submit Resignation Notice
            </Button>
          )
        }
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter exit requests by employee ID or status..."
      />

      <ContentCard title="Resignation & Clearance Applications">
        <DataTable
          columns={[
            { header: 'Request ID', accessor: 'ExitRequestID' },
            { header: 'Employee ID', accessor: 'EmployeeID' },
            { header: 'Resignation Date', accessor: 'ResignationDate' },
            { header: 'Notice Period', render: (row) => `${row.NoticePeriodDays} Days` },
            { header: 'Requested Last Day', accessor: 'RequestedLastWorkingDay' },
            { header: 'Reason', accessor: 'Reason' },
            { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> }
          ]}
          data={filteredRequests}
          emptyMessage="No exit clearance requests found in your permission scope."
        />
      </ContentCard>

      {/* Submit Resignation Modal */}
      <Modal isOpen={isExitModalOpen} onClose={() => setIsExitModalOpen(false)} title="Submit Formal Resignation Notice">
        <form onSubmit={handleSubmitResignation}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Resignation Date" required>
              <input type="date" className="form-input" value={exitForm.ResignationDate} onChange={e => setExitForm({ ...exitForm, ResignationDate: e.target.value })} required />
            </FormField>
            <FormField label="Notice Period (Days)" required>
              <input type="number" className="form-input" value={exitForm.NoticePeriodDays} onChange={e => setExitForm({ ...exitForm, NoticePeriodDays: Number(e.target.value) })} required />
            </FormField>
          </div>

          <FormField label="Requested Last Working Day" required>
            <input type="date" className="form-input" value={exitForm.RequestedLastWorkingDay} onChange={e => setExitForm({ ...exitForm, RequestedLastWorkingDay: e.target.value })} required />
          </FormField>

          <FormField label="Reason for Resignation" required>
            <textarea className="form-textarea" value={exitForm.Reason} onChange={e => setExitForm({ ...exitForm, Reason: e.target.value })} required placeholder="Provide brief reason for resignation..." />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsExitModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Notice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
