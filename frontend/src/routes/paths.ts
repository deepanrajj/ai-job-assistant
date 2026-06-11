/**
 * Stores the app route paths in one place so navigation and router config stay consistent.
 */
export const APP_PATHS = {
  AI_ASSISTANT: '/ai-assistant',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
} as const;

/**
 * Represents every supported application path value.
 */
export type TAppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];
