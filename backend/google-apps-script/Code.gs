/**
 * Mastered HRMS - Google Apps Script Backend API Engine (Secure Fail-Closed Architecture)
 */

var SPREADSHEET_ID_PROPERTY = 'HRMS_SPREADSHEET_ID';
var API_SECRET_TOKEN_PROPERTY = 'HRMS_API_SECRET_TOKEN';

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    var token = e.parameter.token || (e.postData ? JSON.parse(e.postData.contents).token : null);
    var expectedToken = PropertiesService.getScriptProperties().getProperty(API_SECRET_TOKEN_PROPERTY) || 'HRMS_MASTER_SECRET_2026';

    if (token !== expectedToken) {
      logAudit_('ANONYMOUS', 'UNAUTHORIZED_TOKEN_ACCESS', 'FAIL', 'Invalid API Token');
      return createJsonResponse_({ success: false, error: 'Unauthorized: Invalid API Token' }, 401);
    }

    var action = e.parameter.action || (e.postData ? JSON.parse(e.postData.contents).action : null);
    var userEmail = e.parameter.userEmail || (e.postData ? JSON.parse(e.postData.contents).userEmail : null);

    // 1. Resolve Identity Strictly (No default fallback to admin or SUPER_ADMIN!)
    var currentUser = resolveActiveUser_(userEmail);

    if (action === 'ping' || action === 'health') {
      return createJsonResponse_({ success: true, status: 'ONLINE', timestamp: new Date().toISOString() });
    }

    if (!currentUser) {
      logAudit_(userEmail || 'UNIDENTIFIED', 'AUTHENTICATION_FAILURE', 'FAIL', 'Active user identity resolution failed');
      return createJsonResponse_({ success: false, error: 'Access Denied: Unauthenticated or inactive user session' }, 403);
    }

    // 2. Route Operations with Server-Side Authorization Checks
    if (action === 'readAll') {
      if (!hasServerPermission_(currentUser, 'system.readAll')) {
        logAudit_(currentUser.Email, 'UNAUTHORIZED_READ_ALL', 'DENIED', 'Lacks system.readAll permission');
        return createJsonResponse_({ success: false, error: 'Access Denied: Permission system.readAll required' }, 403);
      }
      var allData = readAllSheetsSecure_(currentUser);
      return createJsonResponse_({ success: true, data: allData });
    }

    if (action === 'readSheet') {
      var sheetName = e.parameter.sheetName;
      var records = readSheetData_(sheetName);
      var scoped = applyServerScope_(sheetName, records, currentUser);
      return createJsonResponse_({ success: true, sheetName: sheetName, data: scoped });
    }

    if (action === 'mutate') {
      var postBody = JSON.parse(e.postData.contents);
      var mutation = postBody.mutation;
      var isAllowed = checkServerMutationPermission_(mutation.sheetName, mutation.action, currentUser);
      
      if (!isAllowed) {
        logAudit_(currentUser.Email, 'MUTATION_DENIED', 'DENIED', 'Lacks permission for ' + mutation.action + ' on ' + mutation.sheetName);
        return createJsonResponse_({ success: false, error: 'Access Denied: Unauthorized mutation action' }, 403);
      }

      var result = executeMutationServer_(mutation, currentUser);
      return createJsonResponse_({ success: true, result: result });
    }

    return createJsonResponse_({ success: false, error: 'Invalid Action Parameter' }, 400);

  } catch (err) {
    logAudit_('SYSTEM_ERROR', 'BACKEND_EXCEPTION', 'ERROR', err.toString());
    return createJsonResponse_({ success: false, error: err.toString() }, 500);
  }
}

/**
 * Resolve Active User Identity strictly from Users sheet (Returns NULL if missing or inactive)
 */
function resolveActiveUser_(userEmail) {
  if (!userEmail || typeof userEmail !== 'string') return null; // No userEmail -> Return null!

  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName('Users');
  if (!sheet) return null; // Missing Users sheet -> Deny access!

  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return null;

  var headers = rows[0];
  var emailIdx = headers.indexOf('Email');
  var roleIdx = headers.indexOf('Role');
  var statusIdx = headers.indexOf('Status');
  var empIdIdx = headers.indexOf('EmployeeID');

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row[emailIdx] === userEmail) {
      if (row[statusIdx] !== 'ACTIVE') return null; // Reject inactive users!
      return {
        UserEmail: row[emailIdx],
        Role: row[roleIdx],
        Status: row[statusIdx],
        EmployeeID: row[empIdIdx]
      };
    }
  }
  return null; // Unrecognized email -> Return null!
}

/**
 * Server Permission Authorization Check (Strict Fail-Closed / Default Deny)
 */
function hasServerPermission_(user, requiredPerm) {
  if (!user || user.Status !== 'ACTIVE') return false; // Fail-Closed
  if (user.Role === 'SUPER_ADMIN') return true;
  if (user.Role === 'HR_ADMIN' && requiredPerm !== 'system.readAll') return true;

  // DEFAULT DENY FOR ALL OTHER ROLES
  return false;
}

function checkServerMutationPermission_(sheetName, action, user) {
  if (!user || user.Status !== 'ACTIVE') return false;
  if (user.Role === 'SUPER_ADMIN' || user.Role === 'HR_ADMIN') return true;

  if (sheetName === 'LeaveRequests' && action === 'INSERT') return true;
  if (sheetName === 'PerformanceGoals' && action === 'INSERT') return true;
  if (sheetName === 'ExitRequests' && action === 'INSERT') return true;

  return false;
}

function applyServerScope_(sheetName, records, user) {
  if (!records || !Array.isArray(records)) return [];
  if (!user || user.Status !== 'ACTIVE') return [];

  if (user.Role === 'SUPER_ADMIN' || user.Role === 'HR_ADMIN') return records;

  // Filter SELF records for non-admin roles
  return records.filter(function(r) {
    return String(r.EmployeeID) === String(user.EmployeeID);
  });
}

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty(SPREADSHEET_ID_PROPERTY);
  if (!id) {
    throw new Error('HRMS Spreadsheet ID property not set');
  }
  return SpreadsheetApp.openById(id);
}

function createJsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function logAudit_(userEmail, action, status, details) {
  try {
    var ss = getSpreadsheet_();
    var sheet = ss.getSheetByName('AuditLogs');
    if (sheet) {
      sheet.appendRow([
        'AUD-' + new Date().getTime(),
        userEmail,
        action,
        status,
        details,
        new Date().toISOString()
      ]);
    }
  } catch (e) {
    Logger.log('Audit log failure: ' + e.toString());
  }
}
