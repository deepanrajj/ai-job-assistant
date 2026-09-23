import { memo, useMemo, type FC } from 'react';

import { JobsKanbanCard } from './JobsKanbanCard';
import { useTranslation } from '../../../i18n';
import { jobStatusOptions } from '../jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS, type TJob, type TJobStatus } from '../../../types';

/**
 * Props used by the jobs Kanban board.
 */
interface IJobsKanbanBoardProps {
  jobs: TJob[];
}

/**
 * Groups saved jobs by status.
 *
 * @param {TJob[]} jobs Saved jobs to group.
 * @returns {Record<TJobStatus, TJob[]>} Jobs grouped by status.
 */
const groupJobsByStatus = (jobs: TJob[]): Record<TJobStatus, TJob[]> => {
  const jobsByStatus = jobStatusOptions.reduce<Record<TJobStatus, TJob[]>>(
    (statuses, status) => ({ ...statuses, [status]: [] }),
    {} as Record<TJobStatus, TJob[]>,
  );

  jobs.forEach((job) => {
    jobsByStatus[job.status].push(job);
  });

  return jobsByStatus;
};

/**
 * Renders saved jobs as a horizontally scrollable Kanban board, one column
 * per application status.
 *
 * @param {IJobsKanbanBoardProps} props Component props.
 * @param {TJob[]} props.jobs Saved jobs to group and display.
 * @returns {JSX.Element} Jobs Kanban board.
 */
const JobsKanbanBoardComponent: FC<IJobsKanbanBoardProps> = ({ jobs }) => {
  const { t } = useTranslation();
  const jobsByStatus = useMemo(() => groupJobsByStatus(jobs), [jobs]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {jobStatusOptions.map((status) => {
        const statusJobs = jobsByStatus[status];

        return (
          <section
            aria-label={t(JOB_STATUS_TRANSLATION_KEYS[status])}
            className="w-72 flex-shrink-0 rounded-lg border border-app-border bg-app-surface2 p-3"
            key={status}
          >
            <h3 className="text-sm font-semibold text-app-text">
              {t(JOB_STATUS_TRANSLATION_KEYS[status])}
            </h3>
            <p className="mt-0.5 text-xs text-app-textMuted">
              {t('jobs.kanbanColumnCount', { count: statusJobs.length })}
            </p>

            <div className="mt-3 space-y-2">
              {statusJobs.length > 0 ? (
                statusJobs.map((job) => <JobsKanbanCard job={job} key={job.id} />)
              ) : (
                <p className="rounded-lg border border-dashed border-app-border p-3 text-center text-xs text-app-textMuted">
                  {t('jobs.kanbanColumnEmpty')}
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export const JobsKanbanBoard = memo(JobsKanbanBoardComponent);
