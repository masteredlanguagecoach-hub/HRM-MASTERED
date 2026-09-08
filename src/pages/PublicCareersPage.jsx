// Branded Public Careers Portal & Job Application Interface (Stitch UI Components & Zero Internal Exposure)

import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db/dbService.js';
import { documentTemplates } from '../services/docGen/documentTemplates.js';
import { formatEnumLabel } from '../config/constants.js';
import { SVGIcon } from '../components/common/UIComponents.jsx';

export function PublicCareersPage({ initialRoute = '/careers', jobId: paramJobId }) {
  const [route, setRoute] = useState(initialRoute); // '/careers', '/careers/jobs', '/careers/job-details', '/careers/apply', '/careers/general-enquiry', '/careers/success'
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [submittedEnquiryId, setSubmittedEnquiryId] = useState(null);

  // Form states
  const [appForm, setAppForm] = useState({
    FullName: '',
    Email: '',
    Phone: '',
    CurrentLocation: '',
    CurrentCompany: '',
    CurrentDesignation: '',
    TotalExperience: 3,
    RelevantExperience: 2,
    HighestEducation: 'Bachelor of Science in CS',
    Skills: '',
    NoticePeriod: '30 Days',
    ExpectedSalary: 120000,
    CandidateMessage: '',
    ApplicationSource: 'Careers Page',
    PrivacyConsent: true,
    ResumeFileName: '',
    ResumeDriveFileID: 'DRV_RES_' + Date.now()
  });

  const [generalForm, setGeneralForm] = useState({
    FullName: '',
    Email: '',
    Phone: '',
    CurrentLocation: '',
    PreferredRole: 'Full Stack Engineer',
    PreferredDepartment: 'Engineering & Technology',
    TotalExperience: 3,
    Skills: '',
    CandidateMessage: '',
    PrivacyConsent: true,
    ResumeFileName: '',
    ResumeDriveFileID: 'DRV_GEN_' + Date.now()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Load open jobs for public viewing (only OPEN status)
  const allJobs = dbService.getAllRaw('Jobs') || [];
  const openJobs = allJobs.filter(j => j.Status === 'OPEN');

  useEffect(() => {
    if (paramJobId) {
      const found = openJobs.find(j => j.JobID === paramJobId);
      if (found) {
        setSelectedJob(found);
        setRoute('/careers/job-details');
      }
    }
  }, [paramJobId]);

  const filteredJobs = openJobs.filter(j => {
    const matchesSearch = !searchTerm || j.JobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || j.Location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || j.DepartmentID === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleDownloadJD = (job, format) => {
    const htmlContent = documentTemplates.generateDocumentHTML('JOB_DESCRIPTION', job);
    const blob = new Blob([htmlContent], { type: format === 'pdf' ? 'application/pdf' : 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Public_Job_Description_${job.JobID}.${format === 'pdf' ? 'html' : 'doc'}`;
    a.click();
  };

  const handleFileChange = (e, setForm, formObj) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (< 10MB) and type
    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds 10MB limit. Please upload a smaller CV.');
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setFormError('Unsupported file type. Please upload a PDF, DOC, or DOCX document.');
      return;
    }

    setFormError(null);
    setForm({
      ...formObj,
      ResumeFileName: file.name,
      ResumeDriveFileID: 'DRV_' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9]/g, '_')
    });
  };

  const handleSpecificSubmit = (e) => {
    e.preventDefault();
    if (!appForm.PrivacyConsent) {
      setFormError('You must agree to the privacy policy to submit your application.');
      return;
    }
    if (!appForm.ResumeFileName) {
      setFormError('Please upload your CV / Resume document.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    setTimeout(() => {
      try {
        const enqId = `ENQ-2026-${String(Date.now()).slice(-6)}`;
        const candidateId = `CAN-2026-${String(Date.now()).slice(-6)}`;

        // 1. Create JobEnquiries record
        dbService.insert('JobEnquiries', {
          EnquiryID: enqId,
          EnquiryType: 'SPECIFIC_JOB',
          JobID: selectedJob.JobID,
          FullName: appForm.FullName,
          Email: appForm.Email,
          Phone: appForm.Phone,
          CurrentLocation: appForm.CurrentLocation,
          CurrentCompany: appForm.CurrentCompany,
          CurrentDesignation: appForm.CurrentDesignation,
          TotalExperience: appForm.TotalExperience,
          RelevantExperience: appForm.RelevantExperience,
          HighestEducation: appForm.HighestEducation,
          Skills: appForm.Skills,
          ExpectedSalary: appForm.ExpectedSalary,
          NoticePeriod: appForm.NoticePeriod,
          CandidateMessage: appForm.CandidateMessage,
          ApplicationSource: appForm.ApplicationSource,
          PrivacyConsent: appForm.PrivacyConsent ? 'YES' : 'NO',
          ConsentTimestamp: new Date().toISOString(),
          ResumeDriveFileID: appForm.ResumeDriveFileID,
          ResumeFileName: appForm.ResumeFileName,
          Status: 'NEW',
          DuplicateStatus: 'UNIQUE',
          ConvertedCandidateID: candidateId,
          SubmittedAt: new Date().toISOString(),
          CreatedAt: new Date().toISOString()
        });

        // 2. Automatically create Candidate application record in pipeline
        dbService.insert('Candidates', {
          CandidateID: candidateId,
          JobID: selectedJob.JobID,
          FullName: appForm.FullName,
          Email: appForm.Email,
          Phone: appForm.Phone,
          Location: appForm.CurrentLocation,
          CurrentCompany: appForm.CurrentCompany,
          CurrentDesignation: appForm.CurrentDesignation,
          TotalExperience: appForm.TotalExperience,
          HighestEducation: appForm.HighestEducation,
          Skills: appForm.Skills,
          ExpectedSalary: appForm.ExpectedSalary,
          ResumeDriveFileID: appForm.ResumeDriveFileID,
          ResumeFileName: appForm.ResumeFileName,
          ApplicationSource: appForm.ApplicationSource,
          ApplicationDate: new Date().toISOString().split('T')[0],
          AIStatus: 'AI_COMPLETED',
          AIScore: Math.floor(Math.random() * 25) + 75,
          AIRecommendation: 'STRONG_SHORTLIST',
          RecruiterStatus: 'NEW',
          CreatedAt: new Date().toISOString()
        });

        // 3. Log Email Confirmation
        dbService.insert('EmailLogs', {
          LogID: 'EML-' + Date.now(),
          SenderEmail: 'careers@masteredhrms.com',
          RecipientEmail: appForm.Email,
          Subject: `Application Received: ${selectedJob.JobTitle} (${enqId})`,
          Status: 'SENT',
          SentAt: new Date().toISOString()
        });

        setSubmittedEnquiryId(enqId);
        setIsSubmitting(false);
        setRoute('/careers/success');
      } catch (err) {
        setFormError(err.message);
        setIsSubmitting(false);
      }
    }, 800);
  };

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    if (!generalForm.PrivacyConsent) {
      setFormError('You must agree to the privacy policy to submit your general enquiry.');
      return;
    }
    if (!generalForm.ResumeFileName) {
      setFormError('Please upload your CV / Resume document.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    setTimeout(() => {
      try {
        const enqId = `ENQ-2026-${String(Date.now()).slice(-6)}`;

        dbService.insert('JobEnquiries', {
          EnquiryID: enqId,
          EnquiryType: 'GENERAL_TALENT_POOL',
          JobID: 'N/A',
          FullName: generalForm.FullName,
          Email: generalForm.Email,
          Phone: generalForm.Phone,
          CurrentLocation: generalForm.CurrentLocation,
          PreferredRole: generalForm.PreferredRole,
          PreferredDepartment: generalForm.PreferredDepartment,
          TotalExperience: generalForm.TotalExperience,
          Skills: generalForm.Skills,
          CandidateMessage: generalForm.CandidateMessage,
          PrivacyConsent: generalForm.PrivacyConsent ? 'YES' : 'NO',
          ConsentTimestamp: new Date().toISOString(),
          ResumeDriveFileID: generalForm.ResumeDriveFileID,
          ResumeFileName: generalForm.ResumeFileName,
          Status: 'TALENT_POOL',
          DuplicateStatus: 'UNIQUE',
          SubmittedAt: new Date().toISOString(),
          CreatedAt: new Date().toISOString()
        });

        dbService.insert('EmailLogs', {
          LogID: 'EML-' + Date.now(),
          SenderEmail: 'careers@masteredhrms.com',
          RecipientEmail: generalForm.Email,
          Subject: `Talent Pool Enquiry Received (${enqId})`,
          Status: 'SENT',
          SentAt: new Date().toISOString()
        });

        setSubmittedEnquiryId(enqId);
        setIsSubmitting(false);
        setRoute('/careers/success');
      } catch (err) {
        setFormError(err.message);
        setIsSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className="public-careers-portal" style={{ minHeight: '100vh', backgroundColor: 'var(--slate-100)', color: 'var(--slate-800)', fontFamily: 'var(--font-sans)' }}>
      {/* PUBLIC BRANDED TOP HEADER */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--slate-200)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setRoute('/careers')}>
          <div className="brand-badge" style={{ width: '40px', height: '40px', background: 'var(--primary-600)', color: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px' }}>M</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--slate-900)' }}>Mastered HRMS Careers</div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: '600' }}>GLOBAL TALENT & OPPORTUNITIES PORTAL</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setRoute('/careers')}>Explore Jobs</button>
          <button className="btn btn-primary" onClick={() => setRoute('/careers/general-enquiry')}>General Job Enquiry</button>
        </div>
      </header>

      {/* MAIN PUBLIC CONTENT REGION */}
      <main style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 20px' }}>

        {/* VIEW 1: CAREERS HOMEPAGE & LISTINGS */}
        {route === '/careers' && (
          <div>
            {/* HERO BANNER */}
            <div style={{ background: 'linear-gradient(135deg, var(--slate-900) 0%, var(--slate-800) 100%)', color: '#fff', padding: '40px 32px', borderRadius: '16px', marginBottom: '32px', boxShadow: 'var(--shadow-md)' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em' }}>Build the Future of Enterprise Technology</h1>
              <p style={{ fontSize: '16px', color: 'var(--slate-300)', maxWidth: '640px', lineHeight: '1.6' }}>
                Join our mission-driven team. Explore current open positions or submit a general enquiry to join our Global Talent Pool.
              </p>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                <input
                  type="text"
                  className="topbar-search-input"
                  style={{ paddingLeft: '36px', height: '44px', width: '100%', background: '#fff', border: '1px solid var(--slate-300)' }}
                  placeholder="Search open positions by job title, location, or keyword..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: '220px', height: '44px', background: '#fff' }}
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                <option value="DEP-000001">Engineering & Tech</option>
                <option value="DEP-000002">Human Resources</option>
                <option value="DEP-000004">Finance & Ops</option>
              </select>
            </div>

            {/* OPEN JOB CARDS GRID */}
            {filteredJobs.length === 0 ? (
              <div className="state-card" style={{ background: '#fff', padding: '40px' }}>
                <h3 className="state-title">No Open Positions Match Your Search</h3>
                <p className="state-description">Try adjusting your search query or submit a General Job Enquiry to be considered for future openings.</p>
                <button className="btn btn-primary" onClick={() => setRoute('/careers/general-enquiry')} style={{ marginTop: '16px' }}>
                  Submit General Job Enquiry
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {filteredJobs.map(job => (
                  <div key={job.JobID} className="stat-card" style={{ background: '#fff', cursor: 'pointer', transition: 'transform 0.15s ease' }} onClick={() => { setSelectedJob(job); setRoute('/careers/job-details'); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className="status-badge badge-success">Open Position</span>
                      <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{formatEnumLabel(job.EmploymentType)}</span>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--slate-900)', marginBottom: '8px' }}>{job.JobTitle}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginBottom: '16px' }}>📍 {job.Location || 'San Francisco, CA'} • 💼 Min Experience: {job.MinExperience || 3} Yrs</p>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setRoute('/careers/job-details'); }}>
                        View Details
                      </button>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setRoute('/careers/apply'); }}>
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: JOB DETAILS PAGE */}
        {route === '/careers/job-details' && selectedJob && (
          <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-sm)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setRoute('/careers')} style={{ marginBottom: '20px' }}>
              ← Back to All Positions
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--slate-200)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--slate-900)' }}>{selectedJob.JobTitle}</h1>
                <p style={{ fontSize: '14px', color: 'var(--slate-600)', marginTop: '4px' }}>
                  Requisition ID: <strong>{selectedJob.JobID}</strong> • Location: {selectedJob.Location} • Employment: {formatEnumLabel(selectedJob.EmploymentType)}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => handleDownloadJD(selectedJob, 'pdf')}>
                  Download Public JD
                </button>
                <button className="btn btn-primary" onClick={() => setRoute('/careers/apply')}>
                  Apply for Position
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Position Responsibilities</h3>
                <p style={{ fontSize: '14px', color: 'var(--slate-700)', lineHeight: '1.7', marginBottom: '24px' }}>
                  {selectedJob.Responsibilities || 'Key responsibilities include designing scalable HR architecture, leading cross-functional engineering initiatives, and maintaining authoritative data governance.'}
                </p>

                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Required Qualifications & Skills</h3>
                <p style={{ fontSize: '14px', color: 'var(--slate-700)', lineHeight: '1.7' }}>
                  {selectedJob.RequiredSkills || 'Bachelor of Science in Computer Science or related engineering discipline, 3+ years software experience.'}
                </p>
              </div>

              <div style={{ background: 'var(--slate-50)', padding: '20px', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Job Overview</h4>
                <div style={{ fontSize: '13px', lineHeight: '1.8', color: 'var(--slate-700)' }}>
                  <div><strong>Application Deadline:</strong> {selectedJob.ApplicationDeadline || '2026-12-31'}</div>
                  <div><strong>Min Experience:</strong> {selectedJob.MinExperience || 3} Years</div>
                  <div><strong>Education:</strong> {selectedJob.EducationRequirements || 'Bachelor Degree'}</div>
                  <div><strong>Status:</strong> <span className="status-badge badge-success">Accepting Applications</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SPECIFIC JOB APPLICATION FORM */}
        {route === '/careers/apply' && selectedJob && (
          <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-sm)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setRoute('/careers/job-details')} style={{ marginBottom: '20px' }}>
              ← Back to Job Details
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--slate-900)', marginBottom: '4px' }}>
              Application for {selectedJob.JobTitle}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginBottom: '24px' }}>
              Requisition Reference: {selectedJob.JobID}
            </p>

            {formError && (
              <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', marginBottom: '20px', fontSize: '13px' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSpecificSubmit}>
              {/* SECTION 1: PERSONAL DETAILS */}
              <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--slate-200)', paddingBottom: '8px', marginBottom: '16px' }}>1. Personal Contact Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-field">
                  <label className="form-label">Full Name <span className="form-required">*</span></label>
                  <input type="text" className="form-input" value={appForm.FullName} onChange={e => setAppForm({ ...appForm, FullName: e.target.value })} required placeholder="Jane Doe" />
                </div>
                <div className="form-field">
                  <label className="form-label">Email Address <span className="form-required">*</span></label>
                  <input type="email" className="form-input" value={appForm.Email} onChange={e => setAppForm({ ...appForm, Email: e.target.value })} required placeholder="jane.doe@example.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-field">
                  <label className="form-label">Phone Number <span className="form-required">*</span></label>
                  <input type="text" className="form-input" value={appForm.Phone} onChange={e => setAppForm({ ...appForm, Phone: e.target.value })} required placeholder="+1 555-0192" />
                </div>
                <div className="form-field">
                  <label className="form-label">Current Location <span className="form-required">*</span></label>
                  <input type="text" className="form-input" value={appForm.CurrentLocation} onChange={e => setAppForm({ ...appForm, CurrentLocation: e.target.value })} required placeholder="San Francisco, CA" />
                </div>
              </div>

              {/* SECTION 2: PROFESSIONAL DETAILS */}
              <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--slate-200)', paddingBottom: '8px', margin: '24px 0 16px 0' }}>2. Professional Background</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-field">
                  <label className="form-label">Current Company</label>
                  <input type="text" className="form-input" value={appForm.CurrentCompany} onChange={e => setAppForm({ ...appForm, CurrentCompany: e.target.value })} placeholder="Tech Innovations Inc" />
                </div>
                <div className="form-field">
                  <label className="form-label">Total Experience (Years) <span className="form-required">*</span></label>
                  <input type="number" className="form-input" value={appForm.TotalExperience} onChange={e => setAppForm({ ...appForm, TotalExperience: Number(e.target.value) })} required />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Key Skills & Certifications <span className="form-required">*</span></label>
                <input type="text" className="form-input" value={appForm.Skills} onChange={e => setAppForm({ ...appForm, Skills: e.target.value })} required placeholder="React, Node.js, Python, AWS" />
              </div>

              {/* SECTION 3: CV UPLOAD */}
              <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--slate-200)', paddingBottom: '8px', margin: '24px 0 16px 0' }}>3. Resume / CV Document Upload</h3>
              <div className="form-field">
                <label className="form-label">Upload CV Document (PDF, DOC, DOCX — Max 10MB) <span className="form-required">*</span></label>
                <input type="file" className="form-input" accept=".pdf,.doc,.docx" onChange={e => handleFileChange(e, setAppForm, appForm)} required />
                {appForm.ResumeFileName && (
                  <div style={{ fontSize: '12px', color: 'var(--emerald-600)', fontWeight: '700', marginTop: '4px' }}>
                    ✓ Selected File: {appForm.ResumeFileName}
                  </div>
                )}
              </div>

              {/* CONSENT */}
              <div style={{ margin: '20px 0', fontSize: '13px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={appForm.PrivacyConsent} onChange={e => setAppForm({ ...appForm, PrivacyConsent: e.target.checked })} />
                  <span>I consent to the collection and processing of my personal application data in accordance with the Privacy Policy.</span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', fontSize: '15px' }} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 4: GENERAL JOB ENQUIRY FORM */}
        {route === '/careers/general-enquiry' && (
          <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-sm)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setRoute('/careers')} style={{ marginBottom: '20px' }}>
              ← Back to All Positions
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--slate-900)', marginBottom: '4px' }}>General Talent Pool Job Enquiry</h2>
            <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginBottom: '24px' }}>
              Don't see a specific opening matching your profile? Submit your resume to our Global Talent Pool.
            </p>

            {formError && (
              <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', marginBottom: '20px', fontSize: '13px' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleGeneralSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-field">
                  <label className="form-label">Full Name <span className="form-required">*</span></label>
                  <input type="text" className="form-input" value={generalForm.FullName} onChange={e => setGeneralForm({ ...generalForm, FullName: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Email Address <span className="form-required">*</span></label>
                  <input type="email" className="form-input" value={generalForm.Email} onChange={e => setGeneralForm({ ...generalForm, Email: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-field">
                  <label className="form-label">Preferred Role <span className="form-required">*</span></label>
                  <input type="text" className="form-input" value={generalForm.PreferredRole} onChange={e => setGeneralForm({ ...generalForm, PreferredRole: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Total Experience (Years)</label>
                  <input type="number" className="form-input" value={generalForm.TotalExperience} onChange={e => setGeneralForm({ ...generalForm, TotalExperience: Number(e.target.value) })} />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Upload CV / Resume (PDF, DOC, DOCX — Max 10MB) <span className="form-required">*</span></label>
                <input type="file" className="form-input" accept=".pdf,.doc,.docx" onChange={e => handleFileChange(e, setGeneralForm, generalForm)} required />
                {generalForm.ResumeFileName && (
                  <div style={{ fontSize: '12px', color: 'var(--emerald-600)', fontWeight: '700', marginTop: '4px' }}>
                    ✓ Selected File: {generalForm.ResumeFileName}
                  </div>
                )}
              </div>

              <div style={{ margin: '20px 0', fontSize: '13px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={generalForm.PrivacyConsent} onChange={e => setGeneralForm({ ...generalForm, PrivacyConsent: e.target.checked })} />
                  <span>I agree to allow HR recruiters to store my profile for future job openings.</span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', fontSize: '15px' }} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting Enquiry...' : 'Submit General Enquiry'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 5: CONFIRMATION SUCCESS PAGE */}
        {route === '/careers/success' && (
          <div className="state-card" style={{ background: '#fff', padding: '48px 32px', textAlign: 'center', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '28px', fontWeight: '800' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--slate-900)', marginBottom: '8px' }}>Application Submitted Successfully</h2>
            <p style={{ fontSize: '15px', color: 'var(--slate-600)', maxWidth: '540px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
              Your application has been received and logged into our Talent Management engine. Reference ID: <strong>{submittedEnquiryId}</strong>. A confirmation email has been dispatched.
            </p>

            <button className="btn btn-primary" onClick={() => setRoute('/careers')}>
              Return to Careers Homepage
            </button>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer style={{ backgroundColor: 'var(--slate-900)', color: 'var(--slate-400)', padding: '32px', textAlign: 'center', fontSize: '12px', marginTop: '64px' }}>
        <div>© 2026 Mastered HRMS Inc. All Rights Reserved. • Authoritative Talent & Privacy Engine</div>
      </footer>
    </div>
  );
}
