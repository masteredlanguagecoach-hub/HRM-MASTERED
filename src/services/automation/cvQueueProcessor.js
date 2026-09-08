// CV Processing Queue & Batch Processor (Safe Execution, Retries, Status Transitions)

import { dbService } from '../db/dbService.js';
import { screeningEngine } from '../ai/screeningEngine.js';
import { CANDIDATE_AI_STATUSES } from '../../config/constants.js';

export const cvQueueProcessor = {
  /**
   * Process pending batch of queued candidates
   */
  async processBatch(batchSize = 5) {
    const startTime = new Date();
    const queuedCandidates = dbService.query('Candidates', c =>
      c.AIStatus === CANDIDATE_AI_STATUSES.QUEUED ||
      c.AIStatus === CANDIDATE_AI_STATUSES.RECEIVED
    ).slice(0, batchSize);

    if (queuedCandidates.length === 0) {
      return { processedCount: 0, message: 'No queued CVs awaiting AI screening' };
    }

    const results = [];

    for (const candidate of queuedCandidates) {
      try {
        // Step 1: Mark EXTRACTING
        dbService.update('Candidates', 'CandidateID', candidate.CandidateID, {
          AIStatus: CANDIDATE_AI_STATUSES.EXTRACTING
        });

        // Step 2: Perform AI Screening
        const res = await screeningEngine.screenCandidate(candidate.CandidateID, candidate.JobID);
        results.push({ candidateId: candidate.CandidateID, success: true, score: res.score, recommendation: res.recommendation });
      } catch (e) {
        console.error(`Failed to process candidate ${candidate.CandidateID}:`, e);
        dbService.update('Candidates', 'CandidateID', candidate.CandidateID, {
          AIStatus: CANDIDATE_AI_STATUSES.FAILED
        });
        results.push({ candidateId: candidate.CandidateID, success: false, error: e.message });
      }
    }

    const endTime = new Date();

    // Log automation execution
    dbService.insert('AutomationLogs', {
      LogID: 'LOG-BATCH-' + Date.now(),
      RuleID: 'RULE-CV-BATCH-INTAKE',
      RuleName: 'Automated CV Batch Processing',
      TriggerEvent: 'SCHEDULED_TRIGGER',
      Status: 'COMPLETED',
      ExecutionDetails: `Processed ${results.length} queued CVs in ${endTime - startTime}ms`,
      Timestamp: endTime.toISOString()
    });

    return {
      processedCount: results.length,
      results
    };
  }
};
