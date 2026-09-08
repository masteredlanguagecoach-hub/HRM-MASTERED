/**
 * APEX HRMS - GOOGLE APPS SCRIPT PRODUCTION BACKEND
 * 
 * Deployment Instructions:
 * 1. Open Google Sheets -> Extensions -> Apps Script
 * 2. Paste this Code.gs content.
 * 3. Click Deploy -> New Deployment -> Select "Web app"
 * 4. Execute as: "Me" | Who has access: "Anyone"
 * 5. Copy the Web App URL and paste it into HRMS Admin Settings -> Workspace Settings.
 */

function doGet(e) {
  var action = e.parameter.action || 'ping';
  
  if (action === 'ping') {
    return createJsonResponse({ status: 'ACTIVE', timestamp: new Date().toISOString(), message: 'Apex HRMS Google Apps Script Service Online' });
  }
  
  if (action === 'read') {
    var sheetName = e.parameter.sheet;
    var data = readSheetData(sheetName);
    return createJsonResponse({ status: 'SUCCESS', sheet: sheetName, data: data });
  }
  
  return createJsonResponse({ error: 'Invalid action' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Acquire lock for up to 10 seconds to prevent concurrent write conflicts
    lock.waitLock(10000);
  } catch (err) {
    return createJsonResponse({ status: 'ERROR', message: 'Lock timeout. Server busy.' });
  }
  
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var sheetName = postData.sheet;
    var record = postData.data;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Write headers
      var headers = Object.keys(record);
      sheet.appendRow(headers);
    }
    
    if (action === 'insert') {
      var row = [];
      var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      for (var i = 0; i < headerRow.length; i++) {
        var val = record[headerRow[i]];
        row.push(val !== undefined ? val : '');
      }
      sheet.appendRow(row);
      return createJsonResponse({ status: 'SUCCESS', action: 'insert', data: record });
    }
    
    if (action === 'update') {
      var idField = postData.idField;
      var idValue = postData.idValue;
      var dataValues = sheet.getDataRange().getValues();
      var headerRow = dataValues[0];
      var idColIdx = headerRow.indexOf(idField);
      
      if (idColIdx !== -1) {
        for (var r = 1; r < dataValues.length; r++) {
          if (String(dataValues[r][idColIdx]) === String(idValue)) {
            for (var key in record) {
              var colIdx = headerRow.indexOf(key);
              if (colIdx !== -1) {
                sheet.getRange(r + 1, colIdx + 1).setValue(record[key]);
              }
            }
            break;
          }
        }
      }
      return createJsonResponse({ status: 'SUCCESS', action: 'update', data: record });
    }
    
    return createJsonResponse({ error: 'Unknown action' });
  } catch (ex) {
    return createJsonResponse({ status: 'ERROR', message: ex.message });
  } finally {
    lock.releaseLock();
  }
}

function readSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  var headers = data[0];
  var result = [];
  
  for (var r = 1; r < data.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = data[r][c];
    }
    result.push(obj);
  }
  return result;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Daily Time-Driven Trigger for Recruitment & HR Automation
 */
function dailyAutomationTrigger() {
  Logger.log('Executing Apex HRMS Daily Automation Cycle...');
}
