// Node.js Development Server for Mastered HRMS (Serves static assets from public/ and auto-builds bundle)

import http from 'http';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const PROJECT_ROOT = __dirname;

// Auto-bundle and transpile src files into pure JS public/app.js & CSS public/app.css
function ensureCompiledBundle() {
  try {
    // 1. Build Unified CSS
    const tokensPath = path.join(PROJECT_ROOT, 'src/styles/tokens.css');
    const appCssPath = path.join(PROJECT_ROOT, 'src/styles/app.css');
    const destCssPath = path.join(PROJECT_ROOT, 'public/app.css');

    let tokens = fs.readFileSync(tokensPath, 'utf8').replace(/@import\s+url\([^)]+\);?/g, '');
    let appCss = fs.readFileSync(appCssPath, 'utf8').replace(/@import\s+['"][^'"]+['"];?/g, '');
    fs.writeFileSync(destCssPath, `/* Mastered HRMS Unified Production Stylesheet */\n${tokens}\n${appCss}\n`, 'utf8');
    console.log(`✓ Auto-built unified CSS public/app.css (${fs.statSync(destCssPath).size} bytes)`);

    // 2. Build JavaScript App Bundle
    const fileOrder = [
      'src/config/constants.js',
      'src/config/defaultSettings.js',
      'src/services/db/masterSchema.js',
      'src/services/db/localDbDriver.js',
      'src/services/db/googleSheetsDriver.js',
      'src/services/db/dbService.js',
      'src/services/drive/driveStructure.js',
      'src/services/drive/driveService.js',
      'src/services/ai/cvParser.js',
      'src/services/ai/providerAbstraction.js',
      'src/services/ai/promptTemplates.js',
      'src/services/ai/scoringModel.js',
      'src/services/ai/screeningEngine.js',
      'src/services/automation/cvQueueProcessor.js',
      'src/services/automation/duplicateDetector.js',
      'src/services/automation/scheduledJobs.js',
      'src/services/docGen/documentTemplates.js',
      'src/context/AuthContext.jsx',
      'src/context/AppContext.jsx',
      'src/components/layout/Sidebar.jsx',
      'src/components/layout/Header.jsx',
      'src/components/cv/CandidateProfileModal.jsx',
      'src/components/cv/CandidateComparisonModal.jsx',
      'src/pages/DashboardPage.jsx',
      'src/pages/RecruitmentPage.jsx',
      'src/pages/OnboardingPage.jsx',
      'src/pages/EmployeesPage.jsx',
      'src/pages/AttendanceLeavePage.jsx',
      'src/pages/PayrollPage.jsx',
      'src/pages/TrainingPage.jsx',
      'src/pages/PerformancePage.jsx',
      'src/pages/ExitPage.jsx',
      'src/pages/ReportsPage.jsx',
      'src/pages/SettingsPage.jsx',
      'src/pages/SystemHealthPage.jsx',
      'src/main.jsx'
    ];

    let combinedJsx = `// Mastered HRMS Application Browser Bundle
const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState, useEffect, useContext, createContext } = React;

`;

    fileOrder.forEach(fileRelPath => {
      const fullPath = path.join(PROJECT_ROOT, fileRelPath);
      let code = fs.readFileSync(fullPath, 'utf8');

      // Clean import and export statements
      code = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
      code = code.replace(/import\s+['"][^'"]+['"];?/g, '');
      code = code.replace(/export\s+const\s+/g, 'const ');
      code = code.replace(/export\s+function\s+/g, 'function ');
      code = code.replace(/export\s+default\s+function\s+/g, 'function ');

      combinedJsx += `\n/* --- MODULE: ${fileRelPath} --- */\n` + code + '\n';
    });

    // Transpile JSX to pure JavaScript using Babel standalone
    const babelPath = path.join(PROJECT_ROOT, 'public/vendor/babel.min.js');
    const babelCode = fs.readFileSync(babelPath, 'utf8');
    const sandbox = { console, exports: {}, module: { exports: {} } };
    sandbox.window = sandbox;

    vm.createContext(sandbox);
    vm.runInContext(babelCode, sandbox);

    const result = sandbox.exports.transform(combinedJsx, {
      presets: ['react']
    });

    const outputPath = path.join(PROJECT_ROOT, 'public/app.js');
    fs.writeFileSync(outputPath, result.code, 'utf8');
    console.log(`✓ Auto-compiled pure JS bundle public/app.js (${fs.statSync(outputPath).size} bytes)`);
  } catch (e) {
    console.error('Compilation error:', e);
  }
}

ensureCompiledBundle();

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  let fullPath = path.join(PROJECT_ROOT, 'public', reqPath);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(PROJECT_ROOT, reqPath);
  }
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(PROJECT_ROOT, 'public', 'index.html');
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Mastered HRMS Running at http://localhost:${PORT}`);
  console.log(`📊 Master Database: Google Sheets (38 Master Sheets)`);
  console.log(`📁 File Storage: Google Drive Architecture`);
  console.log(`🤖 AI Provider Engine: Gemini / OpenAI Configurable`);
  console.log(`=======================================================`);
});
