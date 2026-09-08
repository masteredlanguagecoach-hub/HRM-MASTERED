// Attendance & Leave Management Module Page (Attendance Records, Clock-In Widget & Leave Approval Queue)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, DataTable, TableToolbar, Button, StatusBadge, Modal, FormField, ContentCard } from '../components/common/UIComponents.jsx';

export function AttendanceLeavePage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ StartDate: '', EndDate: '', TotalDays: 1, Reason: '' });

  const attendance = dbService.getAll('Attendance', currentUser) || [];
  const leaveRequests = dbService.getAll('LeaveRequests', currentUser) || [];

  const filteredAttendance = attendance.filter(a => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return a.EmployeeID?.toLowerCase().includes(q) || a.Date?.includes(q) || a.Status?.toLowerCase().includes(q);
  });

  const handleClockIn = () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowStr = new Date().toTimeString().slice(0, 5);

      dbService.insert('Attendance', {
        AttendanceID: 'ATT-' + Date.now(),
        EmployeeID: currentUser.EmployeeID,
        Date: todayStr,
        CheckIn: nowStr,
        CheckOut: '',
        WorkingHours: 0,
        Status: 'PRESENT',
        Remarks: 'Web Clock-in'
      }, currentUser);

      showToast(`Clocked in successfully at ${nowStr}`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleApplyLeave = (e) => {
    e.preventDefault();
    try {
      dbService.insert('LeaveRequests', {
        LeaveRequestID: 'LEV-' + Date.now(),
        EmployeeID: currentUser.EmployeeID,
        LeaveTypeID: 'LTP-000001',
        ...leaveForm,
        Status: 'PENDING',
        AppliedAt: new Date().toISOString().split('T')[0]
      }, currentUser);

      showToast('Leave request submitted successfully', 'success');
      setIsLeaveModalOpen(false);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="module-view">
      <PageHeader
        title={hasPermission('attendance.manage') ? 'Attendance & Leave Management' : 'My Attendance & Leave'}
        subtitle="Daily Attendance Logs, Web Clock-In & Employee Leave Request Approvals"
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" icon="attendance" onClick={handleClockIn}>
              Web Clock-In Today
            </Button>
            <Button variant="primary" icon="plus" onClick={() => setIsLeaveModalOpen(true)}>
              Apply for Leave
            </Button>
          </div>
        }
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter attendance logs by employee ID or date..."
      />

      <ContentCard title="Daily Attendance Records">
        <DataTable
          columns={[
            { header: 'Employee ID', accessor: 'EmployeeID' },
            { header: 'Date', accessor: 'Date' },
            { header: 'Check In', accessor: 'CheckIn' },
            { header: 'Check Out', accessor: 'CheckOut' },
            { header: 'Working Hours', render: (row) => `${row.WorkingHours || 0} hrs` },
            { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> }
          ]}
          data={filteredAttendance}
          emptyMessage="No attendance records found."
        />
      </ContentCard>

      <ContentCard title="Leave Application Requests">
        <DataTable
          columns={[
            { header: 'Employee ID', accessor: 'EmployeeID' },
            { header: 'Start Date', accessor: 'StartDate' },
            { header: 'End Date', accessor: 'EndDate' },
            { header: 'Total Days', render: (row) => `${row.TotalDays} Days` },
            { header: 'Reason', accessor: 'Reason' },
            { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> }
          ]}
          data={leaveRequests}
          emptyMessage="No leave requests available."
        />
      </ContentCard>

      {/* Apply Leave Modal */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Submit Leave Request">
        <form onSubmit={handleApplyLeave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Start Date" required>
              <input type="date" className="form-input" value={leaveForm.StartDate} onChange={e => setLeaveForm({ ...leaveForm, StartDate: e.target.value })} required />
            </FormField>
            <FormField label="End Date" required>
              <input type="date" className="form-input" value={leaveForm.EndDate} onChange={e => setLeaveForm({ ...leaveForm, EndDate: e.target.value })} required />
            </FormField>
          </div>

          <FormField label="Reason for Leave" required>
            <textarea className="form-textarea" value={leaveForm.Reason} onChange={e => setLeaveForm({ ...leaveForm, Reason: e.target.value })} required placeholder="State brief reason for leave application..." />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Application</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
