import type { TMissingApplicationReason } from './statusHistory.types';

/**
 * Translation key per reason a job has no recorded application date, used
 * wherever such a date is shown.
 */
export const MISSING_APPLICATION_KEYS: Record<TMissingApplicationReason, string> = {
  notApplied: 'statusHistory.notApplied',
  notRecorded: 'statusHistory.notRecorded',
  unavailable: 'statusHistory.unavailable',
};
