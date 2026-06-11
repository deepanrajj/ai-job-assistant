/**
 * Stores shared frontend error codes used by UI state and API helpers.
 */
export const APP_ERROR_CODES = {
  AI_ANALYZE_FAILED: 'AI_ANALYZE_FAILED',
  AI_ASK_FAILED: 'AI_ASK_FAILED',
  EMPTY_DESCRIPTION: 'EMPTY_DESCRIPTION',
  TRANSLATION_PROVIDER_MISSING: 'TRANSLATION_PROVIDER_MISSING',
  UNKNOWN: 'UNKNOWN',
} as const;

/**
 * Represents every supported frontend error code.
 */
export type TAppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];
