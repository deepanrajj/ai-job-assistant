import type { TJobStatus } from '../../types';

/**
 * Status filter value for the jobs list, including the synthetic "ALL" option.
 */
export type TStatusFilter = TJobStatus | 'ALL';
