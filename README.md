# HRMS AI System

This project implements the eight HR lifecycle modules with Google Sheets as the system database, Google Drive as restricted document storage, workflow automation, and AI-assisted CV screening. AI recommendations never make the final hiring decision; a named human reviewer must shortlist, reject, hold, or move a candidate to interview.

## Current status

The application UI is functional as a local demonstration. Once the secured Apps Script backend is configured, new and updated records are mirrored to Google Sheets, CV files are uploaded to a private Drive folder, and Gemini screening runs server-side. Browser storage remains a UI cache and must not be treated as the authoritative production database until initial remote hydration and conflict handling are completed.

## Secure Google Workspace setup

1. Create a Google Sheet owned by the HR operations account.
2. Open Extensions → Apps Script and paste `backend/google-apps-script/Code.gs`.
3. In Apps Script Project Settings, add Script Properties:
   - `HRMS_ACCESS_TOKEN`: a long random secret shared with authorized HRMS users.
   - `HRMS_DRIVE_ROOT_ID`: the ID of a restricted Drive folder owned by HR.
   - `AI_API_KEY`: the Gemini API key. Never enter it in the HRMS browser UI or a Sheet.
4. Deploy the script as a Web App. Restrict access to the Workspace domain when available.
5. Run `installDailyAutomationTrigger` once from the Apps Script editor and approve the requested scopes.
6. In HRMS Settings, enter the Web App URL and matching HRMS access token.

## Run locally

Install a current Node.js release, then run `npm start` and open `http://localhost:3000`.

## Important production gaps

- Add Workspace identity verification and server-side role authorization; the current access token is only a first security boundary.
- Hydrate the local cache from Sheets at sign-in and add durable retry/conflict queues.
- Replace browser PDF/DOCX parsing with server-side extraction/OCR and add malware scanning.
- Add automated tests, data retention rules, consent notices, bias monitoring, and jurisdiction-specific payroll validation.
- Avoid using protected attributes (such as age, gender, disability, religion, or ethnicity) in CV scoring.
