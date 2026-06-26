/**
 * Stores the app route paths in one place so navigation and router config stay consistent.
 */
export const APP_PATHS = {
  AI_ASSISTANT: '/ai-assistant',
  DASHBOARD: '/dashboard',
  JOB_DETAIL: '/jobs/:jobId',
  JOB_EDIT: '/jobs/:jobId/edit',
  JOB_NEW: '/jobs/new',
  JOBS: '/jobs',
} as const;

/**
 * Represents every supported application path value.
 */
export type TAppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];

/**
 * Builds concrete paths for routes that contain dynamic params.
 */
export const APP_PATH_BUILDERS = {
  jobDetail: (jobId: string): string => `/jobs/${encodeURIComponent(jobId)}`,
  jobEdit: (jobId: string): string => `/jobs/${encodeURIComponent(jobId)}/edit`,
} as const;
