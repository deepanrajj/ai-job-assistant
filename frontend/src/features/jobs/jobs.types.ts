import type { TJobStatus } from '../../types';

/**
 * Status filter value for the jobs list, including the synthetic "ALL" option.
 */
export type TStatusFilter = TJobStatus | 'ALL';

/**
 * Jobs page layout: a sortable/searchable table or a status-grouped Kanban board.
 */
export type TJobsViewMode = 'table' | 'kanban';
