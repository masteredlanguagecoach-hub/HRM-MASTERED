// Payroll Management Module Page (Payroll Processing, Payslips & Compensation Details)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dbService } from '../services/db/dbService.js';
import { PageHeader, DataTable, TableToolbar, Button, StatusBadge, ContentCard, Modal, ConfirmationDialog } from '../components/common/UIComponents.jsx';

export function PayrollPage() {
  const { currentUser, hasPermission } = useAuth();
  const { showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

  const payroll = dbService.getAll('Payroll', currentUser) || [];
  const payrollItems = dbService.getAll('PayrollItems', currentUser) || [];

  const filteredItems = payrollItems.filter(item => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return item.EmployeeID?.toLowerCase().includes(q) || item.MonthYear?.includes(q) || item.Status?.toLowerCase().includes(q);
  });

  const handleProcessPayroll = () => {
    try {
      dbService.insert('Payroll', {
        PayrollID: 'PAY-2026-08',
        MonthYear: '2026-08',
        TotalEmployees: 8,
        TotalGross: 78000,
        TotalDeductions: 12000,
        TotalNet: 66000,
        Status: 'PROCESSED',
        ProcessedBy: currentUser.EmployeeID,
        ProcessedAt: new Date().toISOString()
      }, currentUser);

      showToast('Payroll run for August 2026 processed successfully', 'success');
      setIsProcessModalOpen(false);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="module-view">
      <PageHeader
        title={hasPermission('payroll.process') ? 'Payroll Management' : 'My Payslips'}
        subtitle="Monthly Payroll Processing, Automatic Compensation & Drive Payslip Storage"
        actions={
          hasPermission('payroll.process') && (
            <Button variant="primary" icon="payroll" onClick={() => setIsProcessModalOpen(true)}>
              Run Monthly Payroll
            </Button>
          )
        }
      />

      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter payslips by employee ID or month..."
      />

      {hasPermission('payroll.process') && (
        <ContentCard title="Monthly Payroll Cycles Summary">
          <DataTable
            columns={[
              { header: 'Payroll Cycle', accessor: 'MonthYear' },
              { header: 'Processed Employees', render: (row) => `${row.TotalEmployees} Employees` },
              { header: 'Total Gross', render: (row) => `$${Number(row.TotalGross || 0).toLocaleString()}` },
              { header: 'Total Deductions', render: (row) => `$${Number(row.TotalDeductions || 0).toLocaleString()}` },
              { header: 'Total Net Payroll', render: (row) => `$${Number(row.TotalNet || 0).toLocaleString()}` },
              { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> }
            ]}
            data={payroll}
            emptyMessage="No payroll cycles processed."
          />
        </ContentCard>
      )}

      <ContentCard title={hasPermission('payroll.process') ? 'Employee Payslips Directory' : 'My Personal Payslip Statements'}>
        <DataTable
          columns={[
            { header: 'Employee ID', accessor: 'EmployeeID' },
            { header: 'Month / Year', accessor: 'MonthYear' },
            { header: 'Base Salary', render: (row) => `$${Number(row.BaseSalary || 0).toLocaleString()}` },
            { header: 'Allowances', render: (row) => `$${Number(row.Allowances || 0).toLocaleString()}` },
            { header: 'Gross Salary', render: (row) => `$${Number(row.GrossSalary || 0).toLocaleString()}` },
            { header: 'Net Salary', render: (row) => `<strong>$${Number(row.NetSalary || 0).toLocaleString()}</strong>` },
            { header: 'Status', render: (row) => <StatusBadge status={row.Status} /> },
            { header: 'Action', render: (row) => (
              <Button variant="secondary" size="sm" icon="reports" onClick={() => showToast(`Downloading Payslip PDF (${row.PayslipDriveFileID})`, 'info')}>
                Download PDF
              </Button>
            )}
          ]}
          data={filteredItems}
          emptyMessage="No payslip items available in your permission scope."
        />
      </ContentCard>

      {/* Confirmation Dialog for Running Payroll */}
      <ConfirmationDialog
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onConfirm={handleProcessPayroll}
        title="Execute August 2026 Payroll Run"
        message="Are you sure you want to execute monthly payroll calculation for 8 employees? Net total ($66,000) will be calculated and payslip PDFs will be generated into Google Drive."
        confirmText="Execute Payroll"
      />
    </div>
  );
}
