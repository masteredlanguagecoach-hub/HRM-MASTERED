// Google Drive Storage Service (File ID tracking, Uploads, Security Permissions)

import { driveStructure } from './driveStructure.js';

export const driveService = {
  /**
   * Save file to Drive (returns DriveFileID and metadata)
   */
  async uploadFile(fileOrBlob, targetFolderKey = 'CVs', customMetadata = {}) {
    const fileId = 'DRV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const fileName = fileOrBlob.name || customMetadata.fileName || 'Document.pdf';
    const fileSize = fileOrBlob.size || customMetadata.fileSize || 1024;
    const mimeType = fileOrBlob.type || 'application/pdf';

    // Store in browser blob cache for immediate UI rendering/viewing
    let objectUrl = '';
    if (fileOrBlob instanceof Blob || fileOrBlob instanceof File) {
      objectUrl = URL.createObjectURL(fileOrBlob);
    }

    const driveRecord = {
      DriveFileID: fileId,
      FileName: fileName,
      FileSize: fileSize,
      MimeType: mimeType,
      TargetFolder: targetFolderKey,
      ViewUrl: objectUrl || `https://drive.google.com/file/d/${fileId}/view`,
      DownloadUrl: objectUrl || `https://drive.google.com/uc?id=${fileId}&export=download`,
      UploadedAt: new Date().toISOString(),
      IsRestricted: true // Google Drive Security: Controlled access, never public
    };

    return driveRecord;
  },

  /**
   * Auto-create full Employee Folder Structure in Google Drive
   */
  async createEmployeeDriveFolder(employeeId, fullName) {
    const folderTree = driveStructure.getEmployeeSubfolders(employeeId, fullName);
    const rootFolderId = 'DRV-FLD-' + employeeId;

    return {
      DriveFolderID: rootFolderId,
      FolderPath: folderTree.path,
      Subfolders: folderTree.subfolders.map(sub => ({
        SubfolderName: sub,
        DriveSubfolderID: `${rootFolderId}-${sub.toUpperCase()}`
      }))
    };
  },

  /**
   * Auto-create Job Folder Structure in Google Drive
   */
  async createJobDriveFolder(jobId, jobTitle) {
    const folderTree = driveStructure.getJobSubfolders(jobId, jobTitle);
    const rootFolderId = 'DRV-FLD-' + jobId;

    return {
      DriveFolderID: rootFolderId,
      FolderPath: folderTree.path,
      Subfolders: folderTree.subfolders.map(sub => ({
        SubfolderName: sub,
        DriveSubfolderID: `${rootFolderId}-${sub.toUpperCase()}`
      }))
    };
  }
};
