import { memo, useMemo, type FC } from 'react';

import { useTranslation } from '../../../i18n';
import { statusSolidClasses } from '../jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS, type TJob, type TJobStatus } from '../../../types';

/**
 * Props used by the jobs summary bar.
 */
interface IJobsSummaryCardsProps {
  jobs: TJob[];
}

/**
 * Statuses with their own count. Wishlist and Withdrawn are counted in the
 * total but left out, so the bar stays at five counts.
 */
const SUMMARY_STATUSES: TJobStatus[] = ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

/**
 * Renders the saved-job total and the counts of the main statuses as one
 * stats bar split by thin dividers, each status marked with its colour.
 * From `sm` up the five counts share one row; on phones the total takes a
 * full-width row and the statuses form a 2x2 grid, so no width leaves an
 * empty slot. The dividers are the bar's background showing through a 1px
 * grid gap.
 *
 * Counts cover every saved job, not the current search or filter, so they
 * stay put while the list narrows.
 *
 * @param {IJobsSummaryCardsProps} props Component props.
 * @returns {JSX.Element} Jobs summary bar.
 */
const JobsSummaryCardsComponent: FC<IJobsSummaryCardsProps> = ({ jobs }) => {
  const { t } = useTranslation();
  const counts = useMemo(() => {
    const byStatus = new Map<TJobStatus, number>();

    jobs.forEach((job) => byStatus.set(job.status, (byStatus.get(job.status) ?? 0) + 1));

    return byStatus;
  }, [jobs]);

  return (
    <dl
      // A dl has no role of its own, so the group carries the name.
      aria-label={t('jobs.summaryLabel')}
      role="group"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-app-border bg-app-border shadow-sm sm:grid-cols-5"
    >
      <div className="col-span-2 flex items-center justify-between gap-3 bg-app-surface px-4 py-3 sm:col-span-1 sm:block sm:py-4">
        <dt className="text-sm font-medium text-app-textMuted">{t('jobs.summaryTotal')}</dt>
        <dd className="text-2xl font-semibold text-app-text sm:mt-1">{jobs.length}</dd>
      </div>
      {SUMMARY_STATUSES.map((status) => (
        <div
          className="flex items-center justify-between gap-3 bg-app-surface px-4 py-3 sm:block sm:py-4"
          key={status}
        >
          <dt className="flex min-w-0 items-center gap-2 text-sm font-medium text-app-textMuted">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusSolidClasses[status]}`}
            />
            <span className="truncate">{t(JOB_STATUS_TRANSLATION_KEYS[status])}</span>
          </dt>
          <dd className="text-2xl font-semibold text-app-text sm:mt-1">
            {counts.get(status) ?? 0}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export const JobsSummaryCards = memo(JobsSummaryCardsComponent);
