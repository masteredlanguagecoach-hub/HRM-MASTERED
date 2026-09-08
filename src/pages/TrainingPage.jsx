// Training & Development Module Page (Training Programs, Assignments & Certifications)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, DataTable, TableToolbar, Button, StatusBadge, ContentCard, Modal, FormField } from '../components/common/UIComponents.jsx';

export function TrainingPage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ EmployeeID: 'EMP-000005', TrainingID: 'TRN-000001' });

  const programs = dbService.getAll('TrainingPrograms', currentUser) || [];
  const assignments = dbService.getAll('TrainingAssignments', currentUser) || [];

  const filteredPrograms = programs.filter(p => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return p.TrainingName?.toLowerCase().includes(q) || p.Trainer?.toLowerCase().includes(q) || p.Category?.toLowerCase().includes(q);
  });

  const handleAssignTraining = (e) => {
    e.preventDefault();
    try {
      dbService.insert('TrainingAssignments', {
        AssignmentID: 'TAS-' + Date.now(),
        ...assignForm,
        AssignedBy: currentUser.EmployeeID,
        Status: 'ASSIGNED',
        CompletionDate: '',
        Score: 0
      }, currentUser);

      showToast('Employee assigned to training course successfully', 'success');
      setIsAssignModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="module-view">
      <PageHeader
        title={hasPermission('training.manage') ? 'Training Programs & Assignments' : 'My Learning'}
        subtitle="Skill Development Workshops, AI Certifications & Employee Enrollment Trackers"
        actions={
          hasPermission('training.manage') && (
            <Button variant="primary" icon="training" onClick={() => setIsAssignModalOpen(true)}>
              Assign Course to Employee
            </Button>
          )
        }
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter training programs by title, trainer, or category..."
      />

      <ContentCard title="Active Training Workshops & Programs">
        <DataTable
          columns={[
            { header: 'ID', accessor: 'TrainingID' },
            { header: 'Course Title', accessor: 'TrainingName' },
            { header: 'Trainer', accessor: 'Trainer' },
            { header: 'Category', accessor: 'Category' },
            { header: 'Start Date', accessor: 'StartDate' },
            { header: 'Duration', render: (row) => `${row.DurationHours} Hours` },
            { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> }
          ]}
          data={filteredPrograms}
          emptyMessage="No training programs available."
        />
      </ContentCard>

      <ContentCard title={hasPermission('training.manage') ? 'Employee Course Enrollments' : 'My Enrolled Courses'}>
        <DataTable
          columns={[
            { header: 'Assignment ID', accessor: 'AssignmentID' },
            { header: 'Training ID', accessor: 'TrainingID' },
            { header: 'Employee ID', accessor: 'EmployeeID' },
            { header: 'Assigned By', accessor: 'AssignedBy' },
            { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> }
          ]}
          data={assignments}
          emptyMessage="No course assignments found in your permission scope."
        />
      </ContentCard>

      {/* Assign Course Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Training Course">
        <form onSubmit={handleAssignTraining}>
          <FormField label="Target Employee ID" required>
            <input type="text" className="form-input" value={assignForm.EmployeeID} onChange={e => setAssignForm({ ...assignForm, EmployeeID: e.target.value })} required />
          </FormField>

          <FormField label="Training Course ID" required>
            <input type="text" className="form-input" value={assignForm.TrainingID} onChange={e => setAssignForm({ ...assignForm, TrainingID: e.target.value })} required />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Assignment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
