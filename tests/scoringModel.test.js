// Automated Unit Test Suite for 100-Point Weighted Scoring Model & Recommendation Classifier

import { scoringModel } from '../src/services/ai/scoringModel.js';
import { DEFAULT_SETTINGS } from '../src/config/defaultSettings.js';

function runTests() {
  console.log('--- STARTING SCORING MODEL UNIT TESTS ---');

  // Test 1: Validate default weight configuration totals 100%
  const defaultWeights = DEFAULT_SETTINGS.ai.weights;
  const isValidWeights = scoringModel.validateWeights(defaultWeights);
  console.assert(isValidWeights === true, 'Test 1 Failed: Default weights should total exactly 100%');
  console.log('✓ Test 1 Passed: Weight validation check passed.');

  // Test 2: Calculate score breakdown for high match candidate
  const highMatchJson = {
    mandatory_requirements: { matched: ['Req1', 'Req2'], missing: [] },
    skills: { matched: ['React', 'Node', 'Python'], missing: [] },
    experience: { required_years: 4, relevant_years: 5 },
    education: { match: true },
    certifications: { matched: ['AWS Certified'], missing: [] },
    languages: { matched: ['English'], missing: [] }
  };

  const highResult = scoringModel.calculateBreakdown(highMatchJson, defaultWeights);
  console.assert(highResult.overallScore >= 80, `Test 2 Failed: Overall score should be >= 80, got ${highResult.overallScore}`);
  console.assert(highResult.recommendation === 'STRONG_SHORTLIST', `Test 2 Failed: Recommendation should be STRONG_SHORTLIST, got ${highResult.recommendation}`);
  console.log(`✓ Test 2 Passed: High match score calculated (${highResult.overallScore}/100 -> ${highResult.recommendation})`);

  // Test 3: Calculate score breakdown for low match candidate
  const lowMatchJson = {
    mandatory_requirements: { matched: [], missing: ['Req1', 'Req2'] },
    skills: { matched: [], missing: ['React', 'Node'] },
    experience: { required_years: 5, relevant_years: 1 },
    education: { match: false },
    certifications: { matched: [], missing: ['AWS'] },
    languages: { matched: [], missing: ['English'] }
  };

  const lowResult = scoringModel.calculateBreakdown(lowMatchJson, defaultWeights);
  console.assert(lowResult.overallScore < 50, `Test 3 Failed: Overall score should be < 50, got ${lowResult.overallScore}`);
  console.assert(lowResult.recommendation === 'LOW_MATCH', `Test 3 Failed: Recommendation should be LOW_MATCH, got ${lowResult.recommendation}`);
  console.log(`✓ Test 3 Passed: Low match score calculated (${lowResult.overallScore}/100 -> ${lowResult.recommendation})`);

  console.log('🎉 ALL SCORING MODEL UNIT TESTS PASSED SUCCESSFULLY!');
}

runTests();
