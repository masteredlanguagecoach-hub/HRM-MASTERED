// Google Drive HRMS Folder Hierarchy Manager

export const driveStructure = {
  getRootTree() {
    return {
      folderName: 'HRMS',
      subfolders: [
        {
          folderName: 'Recruitment',
          subfolders: ['Job_Openings', 'Candidates', 'CVs', 'Incoming_CVs', 'Interview_Documents', 'Offers']
        },
        {
          folderName: 'Employees',
          subfolders: [] // Populated per EMP-XXXXXX_Name
        },
        {
          folderName: 'Payroll',
          subfolders: ['Monthly_Payslips', 'Tax_Documents', 'Reports']
        },
        {
          folderName: 'Training',
          subfolders: ['Certificates', 'Materials']
        },
        {
          folderName: 'Performance',
          subfolders: ['Appraisals', 'Development_Plans']
        },
        {
          folderName: 'Exit',
          subfolders: ['Relieving_Letters', 'Exit_Interviews']
        },
        {
          folderName: 'Reports',
          subfolders: []
        },
        {
          folderName: 'Backups',
          subfolders: []
        }
      ]
    };
  },

  getJobSubfolders(jobId, jobTitle) {
    const cleanTitle = jobTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const folderName = `${jobId}_${cleanTitle}`;
    return {
      folderName,
      path: `HRMS/Recruitment/Job_Openings/${folderName}`,
      subfolders: ['CVs', 'Shortlisted', 'Rejected', 'Interviews', 'Offers']
    };
  },

  getEmployeeSubfolders(employeeId, fullName) {
    const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const folderName = `${employeeId}_${cleanName}`;
    return {
      folderName,
      path: `HRMS/Employees/${folderName}`,
      subfolders: ['Profile', 'Identity', 'Employment', 'Payroll', 'Training', 'Performance', 'Exit']
    };
  }
};
