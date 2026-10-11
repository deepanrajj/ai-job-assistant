import { useCallback, useMemo, useState, type ChangeEvent, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  DataTable,
  DataTableToolbar,
  filterDataTableRows,
  normalizeTableSearchText,
  sortDataTableRows,
  type IDataTableSummaryState,
  type TDataTableSortState,
} from '../../components/dataTable';
import { Alert, Button, ErrorState, LoadingState } from '../../components/ui';
import { JobsKanbanBoard } from '../../features/jobs/components/JobsKanbanBoard';
import { JobsSummaryCards } from '../../features/jobs/components/JobsSummaryCards';
import {
  createJobsColumns,
  createJobsFilters,
  createJobsSearchConfig,
  createJobsViewToggle,
} from '../../features/jobs/jobs.config';
import { useMoveJobStatus } from '../../features/jobs/useMoveJobStatus';
import { getApplicationHistory, type IStatusHistoryState } from '../../features/statusHistory';
import { PlusIcon } from '../../components/icons';
import { useBreakpoint } from '../../hooks';
import { useTranslation } from '../../i18n';
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
  const {
    dismissLastMove,
    jobs: displayedJobs,
    lastMove,
    moveJob,
    savedMoveEvents,
  } = useMoveJobStatus(jobs);
  const navigate = useNavigate();
  const isSmallUp = useBreakpoint('sm');
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>('ALL');
  const [viewMode, setViewMode] = useState<TJobsViewMode>('table');
  // A move's alert belongs to the board it happened on, not the next visit.
  const changeViewMode = useCallback(
    (nextViewMode: TJobsViewMode) => {
      if (nextViewMode === viewMode) return;

      dismissLastMove();
      setViewMode(nextViewMode);
    },
    [dismissLastMove, viewMode],
  );

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
  // A history loaded after some moves already holds them, so only moves
  // saved since it arrived are merged in; otherwise they would count twice.
  const [historyBase, setHistoryBase] = useState({
    events: historyEvents,
    savedMoveCount: savedMoveEvents.length,
  });

  if (historyBase.events !== historyEvents)
    setHistoryBase({ events: historyEvents, savedMoveCount: savedMoveEvents.length });

  const movesSinceHistory = savedMoveEvents.slice(historyBase.savedMoveCount);
  const isHistorySettled = Boolean(
    statusHistory && !statusHistory.isLoading && !statusHistory.error,
  );
  const applicationHistory = useMemo(
    // From the jobs as shown, moves included, and the loaded history plus
    // each saved move, so a move dates or undates an application at once
    // without downloading the history again.
    () =>
      historyEvents && isHistorySettled
        ? getApplicationHistory(displayedJobs, [...historyEvents, ...movesSinceHistory])
        : null,
    [displayedJobs, historyEvents, isHistorySettled, movesSinceHistory],
  );
  const columns = useMemo(
    () => createJobsColumns({ applicationHistory, language, t }),
    [applicationHistory, language, t],
  );
  // The board takes the shared search and sort, through the same filter as
  // the table; the status filter does not apply, since it already groups by
  // status. A status sort is kept on offer so both views always agree, even
  // though it changes nothing inside one status column.
  const boardJobs = useMemo(
    () =>
      sortDataTableRows(
        filterDataTableRows(displayedJobs, { search: searchConfig, searchQuery }),
        columns,
        sortState,
      ),
    [columns, displayedJobs, searchConfig, searchQuery, sortState],
  );
  const isBoardFiltered = Boolean(normalizeTableSearchText(searchQuery));
  // A first-run user has nothing to count yet.
  const summaryCards =
    displayedJobs.length > 0 ? <JobsSummaryCards jobs={displayedJobs} /> : undefined;
  const actions = useMemo(
    () => createJobsViewToggle({ onViewModeChange: changeViewMode, t, viewMode }),
    [changeViewMode, t, viewMode],
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

  // The board shares the search and sort, but not the status filter.
  if (viewMode === 'kanban')
    return (
      <div className="space-y-4">
        {summaryCards}
        <DataTableToolbar<TJob>
          columns={columns}
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
              isFiltered={isBoardFiltered}
              jobs={boardJobs}
              lastMove={lastMove}
              onDismissMove={dismissLastMove}
              onMove={moveJob}
            />
          </div>
        </section>
      </div>
    );

  // Counts first, as on the board, then the toolbar and table.
  return (
    <div className="space-y-4">
      {summaryCards}
      {statusHistory?.error && (
        <Alert
          className="flex flex-wrap items-center justify-between gap-3"
          live={false}
          variant="warning"
        >
          <span>{t('jobs.historyUnavailable')}</span>
          <Button onClick={statusHistory.reload} size="sm" variant="secondary">
            {t('jobs.loadErrorRetry')}
          </Button>
        </Alert>
      )}
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
