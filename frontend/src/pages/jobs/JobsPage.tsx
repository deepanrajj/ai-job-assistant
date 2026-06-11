import { useCallback, useMemo, useState, type ChangeEvent, type FC } from 'react';

import {
  DataTable,
  type IDataTableSummaryState,
  type TDataTableSortState,
} from '../../components/dataTable';
import { useTranslation } from '../../i18n';
import {
  createJobsActions,
  createJobsColumns,
  createJobsFilters,
  createJobsSearchConfig,
} from '../../components/jobs/jobs.config';
import type { TStatusFilter } from '../../components/jobs/jobs.types';
import type { TJob } from '../../types';

/**
 * Props used by the jobs page.
 */
interface IJobsPageProps {
  jobs: TJob[];
}

/**
 * Renders the saved jobs workflow with summary, filters, and table results.
 *
 * @param {IJobsPageProps} props Component props.
 * @returns {JSX.Element} Jobs list experience.
 */
export const JobsPage: FC<IJobsPageProps> = ({ jobs }) => {
  const { language, t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>('ALL');

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
  const actions = useMemo(() => createJobsActions(t), [t]);
  const filters = useMemo(
    () =>
      createJobsFilters({
        onStatusFilterChange: handleStatusFilterChange,
        statusFilter,
        t,
      }),
    [handleStatusFilterChange, statusFilter, t],
  );

  return (
    <DataTable<TJob>
      actions={actions}
      caption={t('a11y.jobsTableCaption')}
      columns={columns}
      data={jobs}
      emptyState={{
        description: t('jobs.noJobsFoundDescription'),
        title: t('jobs.noJobsFound'),
      }}
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
