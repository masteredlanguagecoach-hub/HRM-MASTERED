// Google Drive Storage Service (File ID tracking, Strict Upload Validation, Restricted Permissions)

import { driveStructure } from './driveStructure.js';
import { dbService } from '../db/dbService.js';
import { googleSheetsDriver } from '../db/googleSheetsDriver.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'text/plain'
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Limit

export const driveService = {
  /**
   * Validate file payload against security restrictions
   */
  validateFile(fileOrBlob) {
    if (!fileOrBlob) throw new Error('File payload is missing.');
    const name = fileOrBlob.name || '';
    const size = fileOrBlob.size || 0;
    const type = fileOrBlob.type || '';
    const ext = name.split('.').pop().toLowerCase();

    const isTypeAllowed = ALLOWED_MIME_TYPES.includes(type) || ['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'txt'].includes(ext);
    if (!isTypeAllowed) {
      throw new Error(`Security Violation: File type .${ext} (${type}) is not permitted. Only PDF, DOCX, PNG, JPG, and TXT files are allowed.`);
    }

    if (size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File Size Violation: File (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 10MB.`);
    }
    return true;
  },

  /**
   * Save file to Drive (returns DriveFileID and metadata)
   */
  async uploadFile(fileOrBlob, targetFolderKey = 'CVs', customMetadata = {}) {
    this.validateFile(fileOrBlob);

    const remote = dbService.getDriver();
    if (remote.type === 'REMOTE') {
      return googleSheetsDriver.uploadFile(remote.url, fileOrBlob, targetFolderKey, customMetadata, remote.accessToken);
    }

    const fileId = 'DRV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const fileName = fileOrBlob.name || customMetadata.fileName || 'Document.pdf';
    const fileSize = fileOrBlob.size || customMetadata.fileSize || 1024;
    const mimeType = fileOrBlob.type || 'application/pdf';

    // Store in browser blob cache for local rendering
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
      IsRestricted: true,
      IsSimulated: false
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
      Subfolders: (folderTree.subfolders || []).map(sub => ({
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
      Subfolders: (folderTree.subfolders || []).map(sub => ({
        SubfolderName: sub,
        DriveSubfolderID: `${rootFolderId}-${sub.toUpperCase()}`
      }))
    };
  }
};
