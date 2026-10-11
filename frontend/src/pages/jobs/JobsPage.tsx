import { useCallback, useMemo, useState, type ChangeEvent, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  DataTable,
  DataTableToolbar,
  normalizeTableSearchText,
  sortDataTableRows,
  type IDataTableSummaryState,
  type TDataTableSortState,
} from '../../components/dataTable';
import { Button, ErrorState, LoadingState } from '../../components/ui';
import { JobsKanbanBoard } from '../../features/jobs/components/JobsKanbanBoard';
import { JobsSummaryCards } from '../../features/jobs/components/JobsSummaryCards';
import {
  createJobsColumns,
  createJobsFilters,
  createJobsSearchConfig,
  createJobsViewToggle,
} from '../../features/jobs/jobs.config';
import { useMoveJobStatus } from '../../features/jobs/useMoveJobStatus';
import { PlusIcon } from '../../components/icons';
import { useBreakpoint } from '../../hooks';
import type { IStatusHistoryState } from '../../features/dashboard/useStatusHistory';
import { useTranslation } from '../../i18n';
import { getApplicationHistory } from '../../features/dashboard/dashboardInsights.utils';
import type { AppError } from '../../errors';
import { APP_PATHS } from '../../routes/paths';
import type { TJob } from '../../types';
import type { TJobsViewMode, TStatusFilter } from '../../features/jobs/jobs.types';

/**
 * Props used by the jobs page.
 */
interface IJobsPageProps {
  error: AppError | null;
  isLoading: boolean;
  jobs: TJob[];
  onRetry: () => void;
  /**
   * Status history for the applied date, loaded apart from the jobs so its
   * loading or failure only blanks that column. Omitted, the column shows
   * every date as unavailable.
   */
  statusHistory?: IStatusHistoryState;
}

/**
 * Renders the saved jobs workflow: search, status filter, and sort in a
 * toolbar card, status counts, then the table or the status board in one
 * card with the view switch.
 *
 * @param {IJobsPageProps} props Component props.
 * @returns {JSX.Element} Jobs list experience.
 */
export const JobsPage: FC<IJobsPageProps> = ({
  error,
  isLoading,
  jobs,
  onRetry,
  statusHistory,
}) => {
  const { language, t } = useTranslation();
  // Moves apply to every view, so the table and counts agree with the board.
  const { jobs: displayedJobs, lastMove, moveJob } = useMoveJobStatus(jobs);
  const navigate = useNavigate();
  const isSmallUp = useBreakpoint('sm');
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>('ALL');
  const [viewMode, setViewMode] = useState<TJobsViewMode>('table');

  const jobsInitialSort = useMemo<TDataTableSortState>(
    () => ({
      columnId: 'updated',
      direction: 'desc',
    }),
    [],
  );
  // Search and sort live here, not in the table, so both views share them.
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<TDataTableSortState>(jobsInitialSort);
  const getJobRowId = useCallback((job: TJob): string => job.id, []);
  const filterJobsByStatus = useCallback(
    (job: TJob) => statusFilter === 'ALL' || job.status === statusFilter,
    [statusFilter],
  );
  const handleStatusFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value as TStatusFilter);
  }, []);
  const renderJobsSummary = useCallback(
    ({ shown, total }: IDataTableSummaryState) =>
      t('jobs.countSummary', {
        shown,
        total,
      }),
    [t],
  );

  const searchConfig = useMemo(() => createJobsSearchConfig(t), [t]);
  // Only a settled, complete history may date an application.
  const historyEvents = statusHistory?.events ?? null;
  const isHistorySettled = Boolean(
    statusHistory && !statusHistory.isLoading && !statusHistory.error,
  );
  const applicationHistory = useMemo(
    () => (historyEvents && isHistorySettled ? getApplicationHistory(jobs, historyEvents) : null),
    [historyEvents, isHistorySettled, jobs],
  );
  const columns = useMemo(
    () => createJobsColumns({ applicationHistory, language, t }),
    [applicationHistory, language, t],
  );
  // The board takes the shared search and sort; the status filter does not
  // apply to it, since it already groups by status.
  const normalizedSearchQuery = normalizeTableSearchText(searchQuery);
  const boardJobs = useMemo(() => {
    const matching = normalizedSearchQuery
      ? displayedJobs.filter((job) =>
          normalizeTableSearchText(searchConfig.getSearchText(job)).includes(normalizedSearchQuery),
        )
      : displayedJobs;

    return sortDataTableRows(matching, columns, sortState);
  }, [columns, displayedJobs, normalizedSearchQuery, searchConfig, sortState]);
  // Sorting by status means nothing within a status column.
  const boardSortColumns = useMemo(
    () => columns.filter((column) => column.id !== 'status'),
    [columns],
  );
  // A first-run user has nothing to count yet.
  const summaryCards =
    displayedJobs.length > 0 ? <JobsSummaryCards jobs={displayedJobs} /> : undefined;
  const actions = useMemo(
    () => createJobsViewToggle({ onViewModeChange: setViewMode, t, viewMode }),
    [t, viewMode],
  );
  const filters = useMemo(
    () =>
      createJobsFilters({
        onStatusFilterChange: handleStatusFilterChange,
        statusFilter,
        t,
      }),
    [handleStatusFilterChange, statusFilter, t],
  );

  if (isLoading) return <LoadingState label={t('jobs.loading')} />;

  if (error)
    return (
      <ErrorState
        action={<Button onClick={onRetry}>{t('jobs.loadErrorRetry')}</Button>}
        description={error.message}
        title={t('jobs.loadErrorTitle')}
      />
    );

  // The board shows every job, so it has no toolbar: search, filter, and
  // sort apply to the table only.
  if (viewMode === 'kanban')
    return (
      <div className="space-y-4">
        {summaryCards}
        <DataTableToolbar<TJob>
          columns={boardSortColumns}
          onSearchChange={(event) => setSearchQuery(event.target.value)}
          onSortChange={setSortState}
          search={searchConfig}
          searchQuery={searchQuery}
          showSortSelect
          sortState={sortState}
        />
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
          <div className="flex flex-col gap-3 border-b border-app-borderSoft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-app-text">
                {t('jobs.savedJobs')}
              </h2>
              <p className="mt-1 text-sm text-app-textMuted">
                {t('jobs.countSummary', { shown: boardJobs.length, total: displayedJobs.length })}
              </p>
            </div>
            {actions}
          </div>
          <div className="p-4">
            <JobsKanbanBoard
              isFiltered={Boolean(normalizedSearchQuery)}
              jobs={boardJobs}
              lastMove={lastMove}
              onMove={(job, status) => void moveJob(job, status)}
            />
          </div>
        </section>
      </div>
    );

  // Counts first, as on the board, then the toolbar and table.
  return (
    <div className="space-y-4">
      {summaryCards}
      <DataTable<TJob>
        actions={actions}
        caption={t('a11y.jobsTableCaption')}
        columns={columns}
        data={displayedJobs}
        emptyState={
          jobs.length === 0
            ? {
                // From `sm` up the header carries Add Job; on phones it lives in the menu drawer,
                // so the first-run empty state offers it directly.
                action: isSmallUp ? undefined : (
                  <Button leftIcon={<PlusIcon />} onClick={() => navigate(APP_PATHS.JOB_NEW)}>
                    {t('jobs.addJob')}
                  </Button>
                ),
                description: t('jobs.noJobsYetDescription'),
                title: t('jobs.noJobsYet'),
              }
            : {
                description: t('jobs.noJobsFoundDescription'),
                title: t('jobs.noJobsFound'),
              }
        }
        filterPredicate={filterJobsByStatus}
        filters={filters}
        getRowId={getJobRowId}
        onSearchQueryChange={setSearchQuery}
        onSortStateChange={setSortState}
        renderSummary={renderJobsSummary}
        search={searchConfig}
        searchQuery={searchQuery}
        showSortSelect
        sortState={sortState}
        title={t('jobs.savedJobs')}
      />
    </div>
  );
};
