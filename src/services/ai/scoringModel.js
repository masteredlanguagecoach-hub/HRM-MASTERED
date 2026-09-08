// 100-Point Weighted Scoring Model & Recommendation Classifier

import { DEFAULT_SETTINGS } from '../../config/defaultSettings.js';
import { AI_RECOMMENDATIONS } from '../../config/constants.js';

export const scoringModel = {
  /**
   * Validate that weight configuration totals exactly 100%
   */
  validateWeights(weights) {
    const total = Object.values(weights).reduce((sum, w) => sum + Number(w || 0), 0);
    return Math.abs(total - 100) < 0.1;
  },

  /**
   * Calculate detailed breakdown scores based on AI JSON analysis & configurable weights
   */
  calculateBreakdown(analysisJson, customWeights = null) {
    const weights = customWeights || DEFAULT_SETTINGS.ai.weights;

    const mandatoryMatched = analysisJson.mandatory_requirements?.matched?.length || 0;
    const mandatoryTotal = mandatoryMatched + (analysisJson.mandatory_requirements?.missing?.length || 0) || 1;
    const mandatoryRatio = Math.min(1, mandatoryMatched / mandatoryTotal);
    const mandatoryScore = Math.round(mandatoryRatio * weights.mandatory);

    const reqExp = Number(analysisJson.experience?.required_years || 0);
    const actualExp = Number(analysisJson.experience?.relevant_years || 0);
    const expRatio = reqExp === 0 ? 1 : Math.min(1.2, actualExp / reqExp);
    const experienceScore = Math.round(Math.min(1, expRatio) * weights.experience);

    const skillsMatched = analysisJson.skills?.matched?.length || 0;
    const skillsTotal = skillsMatched + (analysisJson.skills?.missing?.length || 0) || 1;
    const skillsRatio = Math.min(1, skillsMatched / skillsTotal);
    const skillsScore = Math.round(skillsRatio * weights.skills);

    const educationMatch = analysisJson.education?.match ? 1 : 0.4;
    const educationScore = Math.round(educationMatch * weights.education);

    const certsMatched = analysisJson.certifications?.matched?.length || 0;
    const certsTotal = certsMatched + (analysisJson.certifications?.missing?.length || 0) || 1;
    const certificationScore = Math.round((certsTotal === 0 ? 1 : certsMatched / certsTotal) * weights.certifications);

    const industryScore = Math.round(0.8 * weights.industry);
    const languageScore = Math.round(1.0 * weights.languages);
    const preferredScore = Math.round(0.7 * weights.preferred);

    const calculatedTotal = Math.min(100, Math.max(0,
      mandatoryScore + experienceScore + skillsScore + educationScore +
      certificationScore + industryScore + languageScore + preferredScore
    ));

    // Determine recommendation based on thresholds
    const thresholds = DEFAULT_SETTINGS.ai.thresholds;
    let recommendation = AI_RECOMMENDATIONS.LOW_MATCH;
    if (calculatedTotal >= thresholds.strongShortlist) {
      recommendation = AI_RECOMMENDATIONS.STRONG_SHORTLIST;
    } else if (calculatedTotal >= thresholds.shortlist) {
      recommendation = AI_RECOMMENDATIONS.SHORTLIST;
    } else if (calculatedTotal >= thresholds.manualReview) {
      recommendation = AI_RECOMMENDATIONS.MANUAL_REVIEW;
    }

    return {
      overallScore: calculatedTotal,
      recommendation,
      mandatoryScore,
      experienceScore,
      skillsScore,
      educationScore,
      certificationScore,
      industryScore,
      languageScore,
      preferredScore
    };
  }
};
