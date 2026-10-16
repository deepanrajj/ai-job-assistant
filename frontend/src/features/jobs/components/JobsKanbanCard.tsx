import { memo, useId, type FC } from 'react';
import { Link } from 'react-router-dom';

import { JobStatusMenu } from './JobStatusMenu';
import { useTranslation } from '../../../i18n';
import { formatJobDate, formatJobSalary } from '../jobs.utils';
import { APP_PATH_BUILDERS } from '../../../routes/paths';
import type { TJob, TJobStatus } from '../../../types';

/**
 * Props used by the jobs Kanban card.
 */
interface IJobsKanbanCardProps {
  /** Focuses the card's status pill once, after the card changed column. */
  focusMoveControl?: boolean;
  /** Limits that focus to when nothing else has it. */
  focusMoveControlOnlyIfLost?: boolean;
  job: TJob;
  onMove?: (job: TJob, status: TJobStatus) => void;
  onMoveControlFocused?: () => void;
}

/**
 * Renders one saved job as a Kanban card: a link to its detail page with
 * company, role, the location and salary that are set, and the last
 * update, the same facts the table shows. With `onMove`, the job's status
 * pill sits beside the link and opens the other statuses to move it. The
 * link and the pill are siblings, since an interactive control may not sit
 * inside a link.
 *
 * @param {IJobsKanbanCardProps} props Component props.
 * @returns {JSX.Element} Jobs Kanban card.
 */
const JobsKanbanCardComponent: FC<IJobsKanbanCardProps> = ({
  focusMoveControl = false,
  focusMoveControlOnlyIfLost = false,
  job,
  onMove,
  onMoveControlFocused,
}) => {
  const { language, t } = useTranslation();
  const details = [job.location, formatJobSalary(job)].filter(Boolean).join(' · ');
  const nameId = useId();

  const link = (
    // Named by company and role only: short, yet two cards from one
    // company still differ. The details and date stay readable inside.
    <Link
      aria-labelledby={`${nameId}-company ${nameId}-role`}
      className="block min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
      to={APP_PATH_BUILDERS.jobDetail(job.id)}
    >
      <p className="font-semibold text-app-text" id={`${nameId}-company`}>
        {job.company}
      </p>
      <p className="mt-0.5 text-sm text-app-textSoft" id={`${nameId}-role`}>
        {job.roleTitle}
      </p>
      {details && <p className="mt-2 text-xs text-app-textMuted">{details}</p>}
      <p className="mt-3 text-xs text-app-textMuted">
        {t('jobs.updatedOn', { date: formatJobDate(job.updatedAt, language) })}
      </p>
    </Link>
  );

  return (
    <article className="rounded-xl border border-app-border bg-app-surface p-4 shadow-sm transition hover:border-primary-300 hover:shadow">
      {onMove ? (
        <JobStatusMenu
          company={job.company}
          currentStatus={job.status}
          focusOnMount={focusMoveControl}
          focusOnlyIfLost={focusMoveControlOnlyIfLost}
          leading={link}
          onFocused={onMoveControlFocused}
          onSelect={(status) => onMove(job, status)}
        />
      ) : (
        link
      )}
    </article>
  );
};

export const JobsKanbanCard = memo(JobsKanbanCardComponent);
