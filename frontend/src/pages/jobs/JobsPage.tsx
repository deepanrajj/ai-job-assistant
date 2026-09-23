import { useCallback, useMemo, useState, type ChangeEvent, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  DataTable,
  type IDataTableSummaryState,
  type TDataTableSortState,
} from '../../components/dataTable';
import { Button, ErrorState, LoadingState } from '../../components/ui';
import { JobsKanbanBoard } from '../../features/jobs/components/JobsKanbanBoard';
import {
  createJobsActions,
  createJobsColumns,
  createJobsFilters,
  createJobsSearchConfig,
  createJobsViewToggle,
} from '../../features/jobs/jobs.config';
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
}

/**
 * Renders the saved jobs workflow with summary, filters, and table results.
 *
 * @param {IJobsPageProps} props Component props.
 * @returns {JSX.Element} Jobs list experience.
 */
export const JobsPage: FC<IJobsPageProps> = ({ error, isLoading, jobs, onRetry }) => {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>('ALL');
  const [viewMode, setViewMode] = useState<TJobsViewMode>('table');

  const jobsInitialSort = useMemo<TDataTableSortState>(
    () => ({
      columnId: 'updated',
      direction: 'desc',
    }),
    [],
  );
  const getJobRowId = useCallback((job: TJob): string => job.id, []);
  const filterJobsByStatus = useCallback(
    (job: TJob) => statusFilter === 'ALL' || job.status === statusFilter,
    [statusFilter],
  );
  const handleStatusFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value as TStatusFilter);
  }, []);
  const handleAddJob = useCallback(() => {
    navigate(APP_PATHS.JOB_NEW);
  }, [navigate]);
  const renderJobsSummary = useCallback(
    ({ shown, total }: IDataTableSummaryState) =>
      t('jobs.countSummary', {
        shown,
        total,
      }),
    [t],
  );

  const searchConfig = useMemo(() => createJobsSearchConfig(t), [t]);
  const columns = useMemo(() => createJobsColumns({ language, t }), [language, t]);
  const actions = useMemo(
    () => (
      <div className="flex items-center gap-3">
        {createJobsViewToggle({ onViewModeChange: setViewMode, t, viewMode })}
        {createJobsActions({ onAddJob: handleAddJob, t })}
      </div>
    ),
    [handleAddJob, t, viewMode],
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

  if (viewMode === 'kanban')
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-app-text">{t('jobs.savedJobs')}</h2>
          {actions}
        </div>
        <JobsKanbanBoard jobs={jobs} />
      </div>
    );

  return (
    <DataTable<TJob>
      actions={actions}
      caption={t('a11y.jobsTableCaption')}
      columns={columns}
      data={jobs}
      emptyState={
        jobs.length === 0
          ? {
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
      initialSort={jobsInitialSort}
      renderSummary={renderJobsSummary}
      search={searchConfig}
      title={t('jobs.savedJobs')}
    />
  );
};
