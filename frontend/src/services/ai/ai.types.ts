/**
 * Translation keys used for AI service fallback errors.
 */
export const AI_FALLBACK_ERROR_TRANSLATION_KEYS = {
  analyzeJob: 'ai.fallbackError.analyzeJob',
  askJob: 'ai.fallbackError.askJob',
} as const;

/**
 * Supported AI fallback error lookup keys.
 */
export type TAiFallbackErrorKey = keyof typeof AI_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Request body for analyzing a pasted job description.
 */
export type TAnalyzeJobRequest = {
  description: string;
};

/**
 * Request body for asking a follow-up question about a job description.
 */
export type TAskJobRequest = {
  description: string;
  question: string;
};
