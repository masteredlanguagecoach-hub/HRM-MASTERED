// Master Default System Settings & AI Screening Weight Configurations

export const DEFAULT_SETTINGS = {
  company: {
    name: 'Mastered HRMS Inc',
    code: 'MHRMS',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    fiscalYearStart: '01-01'
  },
  ai: {
    provider: 'Gemini', // Options: 'Gemini', 'OpenAI', 'LocalNLP'
    model: 'gemini-1.5-pro',
    apiKey: '', // Stored in Settings DB sheet or process.env
    weights: {
      mandatory: 30,
      experience: 20,
      skills: 20,
      education: 10,
      certifications: 5,
      industry: 5,
      languages: 5,
      preferred: 5
    },
    thresholds: {
      strongShortlist: 80,
      shortlist: 65,
      manualReview: 50
    }
  },
  automation: {
    autoScreenOnIntake: true,
    autoShortlistTopCandidates: false,
    duplicateThresholdEmail: 100,
    duplicateThresholdPhoneName: 85
  }
};
