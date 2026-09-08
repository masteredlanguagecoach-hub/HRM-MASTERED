// Candidate Duplicate Detection Engine (Email, Phone, Resume Content)

import { dbService } from '../db/dbService.js';

export const duplicateDetector = {
  /**
   * Scan candidates to detect existing duplicate candidate records
   */
  detectDuplicates(newEmail, newPhone, newFullName, currentCandidateId = '') {
    const allCandidates = dbService.getAll('Candidates');
    const matches = [];

    allCandidates.forEach(cand => {
      if (cand.CandidateID === currentCandidateId) return;

      let score = 0;
      const matchReasons = [];

      // 1. Email match (Strongest key)
      if (newEmail && cand.Email && newEmail.toLowerCase().trim() === cand.Email.toLowerCase().trim()) {
        score += 90;
        matchReasons.push(`Exact email match (${cand.Email})`);
      }

      // 2. Phone match
      const cleanNewPhone = (newPhone || '').replace(/[^0-9]/g, '');
      const cleanCandPhone = (cand.Phone || '').replace(/[^0-9]/g, '');
      if (cleanNewPhone && cleanCandPhone && cleanNewPhone === cleanCandPhone) {
        score += 80;
        matchReasons.push(`Exact phone match (${cand.Phone})`);
      }

      // 3. Name match
      if (newFullName && cand.FullName && newFullName.toLowerCase().trim() === cand.FullName.toLowerCase().trim()) {
        score += 50;
        matchReasons.push(`Identical full name (${cand.FullName})`);
      }

      if (score >= 50) {
        matches.push({
          candidateId: cand.CandidateID,
          fullName: cand.FullName,
          email: cand.Email,
          phone: cand.Phone,
          jobId: cand.JobID,
          appliedDate: cand.ApplicationDate,
          matchScore: score,
          matchReasons
        });
      }
    });

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }
};
