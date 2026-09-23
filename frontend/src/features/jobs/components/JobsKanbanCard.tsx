import { memo, type FC } from 'react';
import { Link } from 'react-router-dom';

import { useTranslation } from '../../../i18n';
import { formatJobSalary } from '../jobs.utils';
import { APP_PATH_BUILDERS } from '../../../routes/paths';
import type { TJob } from '../../../types';

/**
 * Props used by the jobs Kanban card.
 */
interface IJobsKanbanCardProps {
  job: TJob;
}

/**
 * Renders one saved job as a Kanban card linking to its detail page.
 *
 * @param {IJobsKanbanCardProps} props Component props.
 * @param {TJob} props.job Job shown by the card.
 * @returns {JSX.Element} Jobs Kanban card.
 */
const JobsKanbanCardComponent: FC<IJobsKanbanCardProps> = ({ job }) => {
  const { t } = useTranslation();

  return (
    <Link
      aria-label={t('a11y.viewJobDetailsFor', { company: job.company })}
      className="block rounded-lg border border-app-border bg-app-surface p-3 shadow-sm transition hover:border-primary-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface2"
      to={APP_PATH_BUILDERS.jobDetail(job.id)}
    >
      <p className="font-medium text-app-text">{job.company}</p>
      <p className="mt-1 text-sm text-app-textSoft">{job.roleTitle}</p>
      <p className="mt-2 text-xs text-app-textMuted">
        {job.location ?? t('jobs.notSet')} - {formatJobSalary(job) ?? t('jobs.notSet')}
      </p>
    </Link>
  );
};

export const JobsKanbanCard = memo(JobsKanbanCardComponent);
