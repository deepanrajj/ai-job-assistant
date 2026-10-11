import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { Alert } from '../../../components/ui';
import { JobsKanbanCard } from './JobsKanbanCard';
import type { IJobStatusMove } from '../useMoveJobStatus';
import { useTranslation } from '../../../i18n';
import { jobStatusOptions, statusSolidClasses } from '../jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS, type TJob, type TJobStatus } from '../../../types';

/**
 * Props used by the jobs Kanban board.
 */
interface IJobsKanbanBoardProps {
  /** True when a search hides some jobs, so an empty column says so. */
  isFiltered?: boolean;
  jobs: TJob[];
  /** The latest status move, announced and followed by focus. */
  lastMove?: IJobStatusMove | null;
  /** Adds a move-to-status control to every card when given. */
  onMove?: (job: TJob, status: TJobStatus) => void;
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
    jobsByStatus[job.status]?.push(job);
  });

  return jobsByStatus;
};

/**
 * Renders saved jobs as a horizontally scrollable Kanban board, one column
 * per application status. Each column carries its status colour, the same
 * as the status pill and the dashboard pipeline, and a count badge whose
 * full wording is there for screen readers.
 *
 * With `onMove`, each card can move its job to another status. A moved card
 * changes column, so focus follows it to its move control there; each move
 * is announced, and a failed one, whose card returns, gets an alert.
 *
 * @param {IJobsKanbanBoardProps} props Component props.
 * @returns {JSX.Element} Jobs Kanban board.
 */
const JobsKanbanBoardComponent: FC<IJobsKanbanBoardProps> = ({
  isFiltered = false,
  jobs,
  lastMove = null,
  onMove,
}) => {
  const { t } = useTranslation();
  const jobsByStatus = useMemo(() => groupJobsByStatus(jobs), [jobs]);
  const [focusJobId, setFocusJobId] = useState<string | null>(null);
  const [followedMove, setFollowedMove] = useState(lastMove);
  const clearFocusJob = useCallback(() => setFocusJobId(null), []);

  // Each new move, and its failure, sends focus to the card in its column.
  if (lastMove !== followedMove) {
    setFollowedMove(lastMove);
    setFocusJobId(lastMove?.jobId ?? null);
  }

  const moveStatusLabel = lastMove ? t(JOB_STATUS_TRANSLATION_KEYS[lastMove.status]) : '';

  return (
    <div className="space-y-3">
      <p className="sr-only" role="status">
        {lastMove && !lastMove.error
          ? t('jobs.moveStatus.moved', { company: lastMove.company, status: moveStatusLabel })
          : ''}
      </p>
      {lastMove?.error && (
        <Alert role="alert" variant="error">
          {t('jobs.moveStatus.failed', { company: lastMove.company, status: moveStatusLabel })}{' '}
          {lastMove.error.message}
        </Alert>
      )}
      {/* `relative` keeps the columns' screen-reader-only count text, which is
          absolutely positioned, inside this scroll box; without it the last
          columns' text stretched the whole page sideways. */}
      <div className="relative flex gap-4 overflow-x-auto pb-2">
        {jobStatusOptions.map((status) => {
          const statusJobs = jobsByStatus[status];
          const label = t(JOB_STATUS_TRANSLATION_KEYS[status]);

          return (
            <section
              aria-label={label}
              className="w-72 flex-shrink-0 rounded-2xl border border-app-border bg-app-surface2 p-3"
              key={status}
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-app-text">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${statusSolidClasses[status]}`}
                  />
                  {label}
                </h3>
                <span className="rounded-full bg-app-surface px-2 py-0.5 text-xs font-semibold text-app-textSoft ring-1 ring-inset ring-app-border">
                  <span aria-hidden="true">{statusJobs.length}</span>
                  <span className="sr-only">
                    {t('jobs.kanbanColumnCount', { count: statusJobs.length })}
                  </span>
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {statusJobs.length > 0 ? (
                  statusJobs.map((job) => (
                    <JobsKanbanCard
                      focusMoveControl={job.id === focusJobId}
                      job={job}
                      key={job.id}
                      onMove={onMove}
                      onMoveControlFocused={clearFocusJob}
                    />
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-app-border p-4 text-center text-xs text-app-textMuted">
                    {t(isFiltered ? 'jobs.kanbanColumnNoMatch' : 'jobs.kanbanColumnEmpty')}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export const JobsKanbanBoard = memo(JobsKanbanBoardComponent);
