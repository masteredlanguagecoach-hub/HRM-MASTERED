// Versioned AI Screening Prompts, System Instructions, PII Scrubbing and Fairness Rules

export const PROMPT_VERSION = 'v2.1';

export const AI_SYSTEM_INSTRUCTION = `You are a senior recruitment evaluation AI assistant for an enterprise Human Resource Management System (HRMS).

CRITICAL FAIRNESS & NON-DISCRIMINATION RULES:
1. You MUST evaluate candidates strictly on legitimate, job-related qualifications, skills, experience, education, and achievements.
2. DO NOT evaluate or score candidates based on protected personal characteristics: religion, caste, race, ethnicity, political affiliation, marital status, pregnancy, family status, disability (unless legally relevant), photograph, age, or gender.
3. If the candidate CV contains sensitive personal details, explicitly ignore them.
4. You are an assistive decision-support tool. A human recruiter makes the final hiring decision.

OUTPUT INSTRUCTIONS:
- You MUST return valid, raw, unformatted JSON only.
- Do NOT wrap JSON in markdown code blocks (\`\`\`json).
- Distinguish between EXPLICITLY_STATED, INFERRED, and NOT_FOUND information. Do NOT hallucinate skills or qualifications not mentioned in the CV.
`;

export const promptTemplates = {
  /**
   * Server-Side / Client-Side PII Scrubbing Filter
   * Strips explicit mentions of age, gender, photo URLs, religion, marital status
   */
  scrubPii(rawCvText) {
    if (!rawCvText) return '';
    return String(rawCvText)
      .replace(/(?:date of birth|dob|age|gender|sex|marital status|religion|caste|ethnicity|race):\s*[^\n\r]+/gi, '[PROTECTED_PII_REMOVED]')
      .replace(/(?:married|single|divorced|widowed|male|female|non-binary)\b/gi, '[PII]')
      .replace(/https?:\/\/[^\s]+(?:\.png|\.jpg|\.jpeg|\.gif)/gi, '[PHOTO_LINK_REMOVED]')
      .trim();
  },

  buildScreeningPrompt(job, candidateCvText, configWeights) {
    const cleanCvText = this.scrubPii(candidateCvText);

    return `EVALUATE THE FOLLOWING CANDIDATE CV AGAINST THE SPECIFIC JOB REQUISITION.

=== JOB REQUISITION DETAILS ===
Job Title: ${job.JobTitle || 'Software Engineer'}
Department: ${job.DepartmentID || 'Engineering'}
Minimum Experience: ${job.MinExperience || 0} Years
Maximum Experience: ${job.MaxExperience || 99} Years
Education Requirements: ${job.EducationRequirements || 'Bachelor Degree'}
Required Skills: ${job.RequiredSkills || 'N/A'}
Preferred Skills: ${job.PreferredSkills || 'N/A'}
Required Certifications: ${job.RequiredCertifications || 'N/A'}
Required Languages: ${job.RequiredLanguages || 'English'}
Industry Experience: ${job.RequiredIndustryExperience || 'N/A'}
Location Requirement: ${job.Location || 'N/A'}

=== JOB DESCRIPTION ===
${job.JobDescription || 'N/A'}

=== MANDATORY REQUIREMENTS ===
${job.MandatoryRequirements || 'N/A'}

=== PREFERRED REQUIREMENTS ===
${job.PreferredRequirements || 'N/A'}

=== CONFIGURABLE WEIGHTING MODEL ===
Mandatory Requirements: ${configWeights?.mandatory || 30}%
Relevant Experience: ${configWeights?.experience || 20}%
Required Skills: ${configWeights?.skills || 20}%
Education: ${configWeights?.education || 10}%
Certifications: ${configWeights?.certifications || 5}%
Industry Experience: ${configWeights?.industry || 5}%
Language Requirements: ${configWeights?.languages || 5}%
Other Preferred Criteria: ${configWeights?.preferred || 5}%
Total: 100%

=== EXTRACTED CV TEXT (PII SCRUBBED) ===
${cleanCvText}

=== REQUIRED JSON RESPONSE FORMAT ===
{
  "candidate_summary": "Concise 2-sentence summary of candidate suitability",
  "overall_score": 85,
  "recommendation": "STRONG_SHORTLIST",
  "confidence": 0.95,
  "mandatory_requirements": {
    "matched": ["Requirement 1 matched"],
    "missing": ["Requirement 2 missing"],
    "unclear": ["Requirement 3 unclear"]
  },
  "skills": {
    "matched": ["Skill A"],
    "missing": ["Skill B"],
    "additional": ["Skill C"]
  },
  "experience": {
    "required_years": ${job.MinExperience || 0},
    "estimated_years": 5,
    "relevant_years": 4,
    "assessment": "Assessment of candidate work timeline and depth"
  },
  "education": {
    "required": "${job.EducationRequirements || 'Bachelor Degree'}",
    "candidate": "Degree found on CV",
    "match": true
  },
  "certifications": {
    "matched": [],
    "missing": []
  },
  "languages": {
    "matched": ["English"],
    "missing": []
  },
  "strengths": ["Key strength 1", "Key strength 2"],
  "weaknesses": ["Area of improvement 1"],
  "risk_flags": [],
  "career_relevance": "High relevance for current open role",
  "explanation": "Detailed step-by-step breakdown explaining why candidate received this score"
}
`;
  }
};
