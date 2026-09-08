// AI Screening Engine Orchestrator

import { dbService } from '../db/dbService.js';
import { providerAbstraction } from './providerAbstraction.js';
import { promptTemplates, AI_SYSTEM_INSTRUCTION, PROMPT_VERSION } from './promptTemplates.js';
import { scoringModel } from './scoringModel.js';
import { CANDIDATE_AI_STATUSES, PIPELINE_STAGES } from '../../config/constants.js';

export const screeningEngine = {
  /**
   * Run full AI CV Screening against a Candidate and Job
   */
  async screenCandidate(candidateId, jobId, customProvider = null, customModel = null) {
    const startTime = new Date();
    const candidate = dbService.getById('Candidates', 'CandidateID', candidateId);
    const job = dbService.getById('Jobs', 'JobID', jobId);

    if (!candidate || !job) {
      throw new Error(`Candidate (${candidateId}) or Job (${jobId}) not found for screening`);
    }

    // Update status to AI_PROCESSING
    dbService.update('Candidates', 'CandidateID', candidateId, {
      AIStatus: CANDIDATE_AI_STATUSES.AI_PROCESSING
    });

    // Retrieve settings for provider, model, and weights
    const settings = dbService.getAll('Settings');
    const getVal = key => settings.find(s => s.SettingKey === key)?.SettingValue;

    const provider = customProvider || getVal('ai_provider') || 'Gemini';
    const model = customModel || getVal('ai_model') || 'gemini-1.5-pro';
    const apiKey = getVal('ai_api_key') || '';
    const weightsJson = getVal('ai_weights');
    const configWeights = weightsJson ? JSON.parse(weightsJson) : null;

    const cvText = candidate.ResumeText || 'No extracted resume text available';
    const prompt = promptTemplates.buildScreeningPrompt(job, cvText, configWeights);

    let rawOutput = '';
    let parsedJson = null;
    let errorMessage = '';

    try {
      rawOutput = await providerAbstraction.generateCompletion({
        provider,
        model,
        apiKey,
        prompt,
        systemInstruction: AI_SYSTEM_INSTRUCTION
      });

      // Attempt strict JSON parsing
      parsedJson = this.parseAndRepairJson(rawOutput);
    } catch (e) {
      errorMessage = e.message;
      console.error('AI CV Screening Execution Error:', e);
    }

    const endTime = new Date();

    // If parsing failed or error occurred
    if (!parsedJson) {
      // Log failure in AIProcessingLogs
      dbService.insert('AIProcessingLogs', {
        LogID: 'LOG-' + Date.now(),
        CandidateID: candidateId,
        JobID: jobId,
        Provider: provider,
        Model: model,
        StartedAt: startTime.toISOString(),
        CompletedAt: endTime.toISOString(),
        Status: 'FAILED',
        InputCharacters: prompt.length,
        OutputCharacters: rawOutput.length,
        EstimatedCost: 0,
        Error: errorMessage || 'Invalid JSON response from AI provider',
        RetryCount: 1,
        PromptVersion: PROMPT_VERSION
      });

      // Update candidate status to FAILED
      dbService.update('Candidates', 'CandidateID', candidateId, {
        AIStatus: CANDIDATE_AI_STATUSES.FAILED,
        AIRecommendation: 'MANUAL_REVIEW'
      });

      return { success: false, error: errorMessage || 'JSON output validation failed' };
    }

    // Calculate score breakdown
    const scoreData = scoringModel.calculateBreakdown(parsedJson, configWeights);
    const finalScore = parsedJson.overall_score || scoreData.overallScore;

    // Create persistent CandidateScreenings record
    const screeningRecord = dbService.insert('CandidateScreenings', {
      CandidateID: candidateId,
      JobID: jobId,
      ResumeDriveFileID: candidate.ResumeDriveFileID || 'DRV-CV-TEMP',
      AIProvider: provider,
      AIModel: model,
      PromptVersion: PROMPT_VERSION,
      ScreeningDate: new Date().toISOString(),
      OverallScore: finalScore,
      Recommendation: scoreData.recommendation,
      Confidence: parsedJson.confidence || 0.9,
      MandatoryMatchScore: scoreData.mandatoryScore,
      ExperienceScore: scoreData.experienceScore,
      SkillsScore: scoreData.skillsScore,
      EducationScore: scoreData.educationScore,
      CertificationScore: scoreData.certificationScore,
      IndustryScore: scoreData.industryScore,
      LanguageScore: scoreData.languageScore,
      MatchedRequirements: JSON.stringify(parsedJson.mandatory_requirements?.matched || []),
      MissingRequirements: JSON.stringify(parsedJson.mandatory_requirements?.missing || []),
      UnclearRequirements: JSON.stringify(parsedJson.mandatory_requirements?.unclear || []),
      Strengths: JSON.stringify(parsedJson.strengths || []),
      Weaknesses: JSON.stringify(parsedJson.weaknesses || []),
      RiskFlags: JSON.stringify(parsedJson.risk_flags || []),
      AIExplanation: parsedJson.explanation || parsedJson.candidate_summary || 'AI Screening Completed',
      HumanDecision: 'PENDING_REVIEW',
      HumanDecisionBy: '',
      HumanDecisionAt: '',
      OverrideReason: '',
      ProcessingStatus: 'COMPLETED',
      ErrorMessage: ''
    });

    // Update Candidates table
    dbService.update('Candidates', 'CandidateID', candidateId, {
      AIScore: finalScore,
      AIRecommendation: scoreData.recommendation,
      AIStatus: CANDIDATE_AI_STATUSES.AI_COMPLETED,
      RecruiterStatus: PIPELINE_STAGES.AI_REVIEWED
    });

    // Log success in AIProcessingLogs
    dbService.insert('AIProcessingLogs', {
      LogID: 'LOG-' + Date.now(),
      CandidateID: candidateId,
      JobID: jobId,
      Provider: provider,
      Model: model,
      StartedAt: startTime.toISOString(),
      CompletedAt: endTime.toISOString(),
      Status: 'SUCCESS',
      InputCharacters: prompt.length,
      OutputCharacters: rawOutput.length,
      EstimatedCost: 0.002,
      Error: '',
      RetryCount: 0,
      PromptVersion: PROMPT_VERSION
    });

    // Trigger Notification for high score
    if (finalScore >= 80) {
      dbService.insert('Notifications', {
        RecipientID: candidate.AssignedRecruiter || 'EMP-000003',
        Title: '🔥 Strong Candidate Detected!',
        Message: `Candidate ${candidate.FullName} scored ${finalScore}/100 (${scoreData.recommendation}) for job ${job.JobTitle}`,
        Type: 'HIGH_SCORE_CV',
        TargetModule: 'Recruitment',
        TargetID: candidateId,
        IsRead: false
      });
    }

    return {
      success: true,
      screeningId: screeningRecord.ScreeningID,
      score: finalScore,
      recommendation: scoreData.recommendation,
      analysis: parsedJson
    };
  },

  /**
   * Robust JSON repair for malformed LLM responses
   */
  parseAndRepairJson(raw) {
    if (!raw) return null;
    let text = raw.trim();

    // Remove markdown code blocks if present
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      // Find first '{' and last '}'
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const substring = text.substring(start, end + 1);
        try {
          return JSON.parse(substring);
        } catch (e2) {
          console.warn('Structured JSON repair attempted but failed:', e2);
        }
      }
    }
    return null;
  }
};
