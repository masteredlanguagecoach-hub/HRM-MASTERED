// Attendance & Leave Management Module Page (Admin Daily Attendance Marking, Employee Attendance Report & Leave Requests)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, DataTable, TableToolbar, Button, StatusBadge, Modal, FormField, ContentCard, Tabs } from '../components/common/UIComponents.jsx';

export function AttendanceLeavePage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'leave'
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);

  const [leaveForm, setLeaveForm] = useState({ StartDate: '', EndDate: '', TotalDays: 1, Reason: '' });

  const [markForm, setMarkForm] = useState({
    EmployeeID: 'EMP-000005',
    Date: new Date().toISOString().split('T')[0],
    CheckIn: '09:00',
    CheckOut: '18:00',
    WorkingHours: 9,
    Status: 'PRESENT',
    Remarks: 'Admin Manual Daily Attendance Log'
  });

  const attendance = dbService.getAll('Attendance', currentUser) || [];
  const employees = dbService.getAll('Employees', currentUser) || [];
  const leaveRequests = dbService.getAll('LeaveRequests', currentUser) || [];

  const isAdmin = hasPermission('attendance.manage');

  const filteredAttendance = attendance.filter(a => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return a.EmployeeID?.toLowerCase().includes(q) || a.Date?.includes(q) || a.Status?.toLowerCase().includes(q);
  });

  const employeeAttendanceStats = () => {
    const empLogs = attendance.filter(a => a.EmployeeID === currentUser.EmployeeID);
    const present = empLogs.filter(a => a.Status === 'PRESENT').length;
    const absent = empLogs.filter(a => a.Status === 'ABSENT').length;
    const late = empLogs.filter(a => a.Status === 'LATE').length;
    const totalHours = empLogs.reduce((acc, curr) => acc + (Number(curr.WorkingHours) || 0), 0);
    return { count: empLogs.length, present, absent, late, totalHours };
  };

  const stats = employeeAttendanceStats();

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

  const handleAdminMarkAttendance = (e) => {
    e.preventDefault();
    try {
      dbService.insert('Attendance', {
        AttendanceID: 'ATT-' + Date.now(),
        ...markForm,
        CreatedAt: new Date().toISOString()
      }, currentUser);

      dbService.insert('AuditLogs', {
        AuditID: 'AUD-' + Date.now(),
        UserEmail: currentUser.Email,
        Action: 'MARK_DAILY_ATTENDANCE',
        Module: 'ATTENDANCE',
        Details: `Admin marked daily attendance for ${markForm.EmployeeID} as ${markForm.Status} on ${markForm.Date}`,
        Timestamp: new Date().toISOString()
      }, currentUser);

      showToast(`Daily Attendance marked for ${markForm.EmployeeID} as ${markForm.Status}`, 'success');
      setIsMarkModalOpen(false);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleBulkMarkAllPresent = () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      employees.forEach(emp => {
        dbService.insert('Attendance', {
          AttendanceID: 'ATT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          EmployeeID: emp.EmployeeID,
          Date: todayStr,
          CheckIn: '09:00',
          CheckOut: '18:00',
          WorkingHours: 9,
          Status: 'PRESENT',
          Remarks: 'Admin Bulk Daily Attendance Entry'
        }, currentUser);
      });

      showToast(`Bulk daily attendance logged: All ${employees.length} employees marked PRESENT`, 'success');
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

  const handleDownloadAttendanceReport = (format) => {
    const reportTitle = `Attendance_Report_${currentUser.EmployeeID}_${new Date().toISOString().split('T')[0]}`;
    const content = `Attendance Report for ${currentUser.FullName} (${currentUser.EmployeeID})\n\n` +
      `Total Days: ${stats.count}\nPresent: ${stats.present}\nAbsent: ${stats.absent}\nLate: ${stats.late}\nTotal Hours: ${stats.totalHours} hrs\n\n` +
      `Date | Check In | Check Out | Hours | Status | Remarks\n` +
      filteredAttendance.map(a => `${a.Date} | ${a.CheckIn || '--'} | ${a.CheckOut || '--'} | ${a.WorkingHours || 0} hrs | ${a.Status} | ${a.Remarks || ''}`).join('\n');

    const blob = new Blob([content], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportTitle}.${format === 'pdf' ? 'txt' : 'csv'}`;
    a.click();
    showToast(`Downloaded Attendance Report (${format.toUpperCase()})`, 'success');
  };

  return (
    <div className="module-view">
      <PageHeader
        title={isAdmin ? 'Daily Attendance Marking & Leave Administration' : 'My Attendance Report & Leave Requests'}
        subtitle={isAdmin ? 'Admin Daily Attendance Entry, Bulk Logging & Leave Approvals' : 'Personal Attendance Log, Monthly Summary & Leave Application'}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            {isAdmin ? (
              <>
                <Button variant="primary" icon="plus" onClick={() => setIsMarkModalOpen(true)}>
                  Mark Daily Attendance
                </Button>
                <Button variant="secondary" icon="check" onClick={handleBulkMarkAllPresent}>
                  Bulk Mark All Present
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" icon="attendance" onClick={handleClockIn}>
                  Web Clock-In Today
                </Button>
                <Button variant="primary" icon="plus" onClick={() => setIsLeaveModalOpen(true)}>
                  Apply for Leave
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* EMPLOYEE SUMMARY CARD */}
      {!isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-title">Days Present</div>
            <div className="stat-value" style={{ color: 'var(--emerald-600)' }}>{stats.present}</div>
            <div className="stat-sub">This Month</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Days Absent</div>
            <div className="stat-value" style={{ color: 'var(--rose-600)' }}>{stats.absent}</div>
            <div className="stat-sub">This Month</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Late Arrivals</div>
            <div className="stat-value" style={{ color: 'var(--amber-600)' }}>{stats.late}</div>
            <div className="stat-sub">This Month</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Hours Worked</div>
            <div className="stat-value" style={{ color: 'var(--primary-600)' }}>{stats.totalHours} hrs</div>
            <div className="stat-sub">Log Summary</div>
          </div>
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'attendance', label: isAdmin ? 'Daily Attendance Registry' : 'My Attendance Report', icon: 'attendance' },
          { id: 'leave', label: 'Leave Requests & Approvals', icon: 'reports' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter logs by employee ID, date, or status..."
      />

      {activeTab === 'attendance' && (
        <ContentCard
          title={isAdmin ? "Organization Daily Attendance Logs" : "My Monthly Attendance Report & History"}
          action={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm" icon="reports" onClick={() => handleDownloadAttendanceReport('pdf')}>
                Export Attendance PDF
              </Button>
              <Button variant="secondary" size="sm" icon="reports" onClick={() => handleDownloadAttendanceReport('csv')}>
                Export CSV Statement
              </Button>
            </div>
          }
        >
          <DataTable
            columns={[
              { header: 'Attendance ID', accessor: 'AttendanceID' },
              { header: 'Employee ID', accessor: 'EmployeeID' },
              { header: 'Date', accessor: 'Date' },
              { header: 'Check In', accessor: 'CheckIn' },
              { header: 'Check Out', accessor: 'CheckOut' },
              { header: 'Working Hours', render: (row) => `${row.WorkingHours || 0} hrs` },
              { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> },
              { header: 'Remarks', accessor: 'Remarks' }
            ]}
            data={filteredAttendance}
            emptyMessage="No attendance records logged."
          />
        </ContentCard>
      )}

      {activeTab === 'leave' && (
        <ContentCard title="Leave Requests & Approval Queue">
          <DataTable
            columns={[
              { header: 'Leave ID', accessor: 'LeaveRequestID' },
              { header: 'Employee ID', accessor: 'EmployeeID' },
              { header: 'Start Date', accessor: 'StartDate' },
              { header: 'End Date', accessor: 'EndDate' },
              { header: 'Total Days', accessor: 'TotalDays' },
              { header: 'Reason', accessor: 'Reason' },
              { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> }
            ]}
            data={leaveRequests}
            emptyMessage="No leave requests submitted."
          />
        </ContentCard>
      )}

      {/* ADMIN MARK DAILY ATTENDANCE MODAL */}
      {isMarkModalOpen && (
        <Modal isOpen={isMarkModalOpen} onClose={() => setIsMarkModalOpen(false)} title="Mark Daily Attendance (Super Admin)">
          <form onSubmit={handleAdminMarkAttendance}>
            <FormField label="Select Employee" required>
              <select className="form-select" value={markForm.EmployeeID} onChange={e => setMarkForm({ ...markForm, EmployeeID: e.target.value })}>
                {employees.map(emp => (
                  <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FirstName} {emp.LastName} ({emp.EmployeeID})</option>
                ))}
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Attendance Date" required>
                <input type="date" className="form-input" value={markForm.Date} onChange={e => setMarkForm({ ...markForm, Date: e.target.value })} required />
              </FormField>
              <FormField label="Attendance Status" required>
                <select className="form-select" value={markForm.Status} onChange={e => setMarkForm({ ...markForm, Status: e.target.value })}>
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF DAY</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                </select>
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Check-In Time">
                <input type="time" className="form-input" value={markForm.CheckIn} onChange={e => setMarkForm({ ...markForm, CheckIn: e.target.value })} />
              </FormField>
              <FormField label="Check-Out Time">
                <input type="time" className="form-input" value={markForm.CheckOut} onChange={e => setMarkForm({ ...markForm, CheckOut: e.target.value })} />
              </FormField>
            </div>

            <FormField label="Admin Remarks / Notes">
              <input type="text" className="form-input" value={markForm.Remarks} onChange={e => setMarkForm({ ...markForm, Remarks: e.target.value })} />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setIsMarkModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Log Daily Attendance</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* APPLY LEAVE MODAL */}
      {isLeaveModalOpen && (
        <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Apply for Leave">
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
              <textarea className="form-textarea" value={leaveForm.Reason} onChange={e => setLeaveForm({ ...leaveForm, Reason: e.target.value })} required rows={3} />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Submit Leave Request</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
