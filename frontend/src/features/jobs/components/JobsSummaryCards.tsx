import { memo, useMemo, type FC } from 'react';

import { useTranslation } from '../../../i18n';
import { statusSolidClasses } from '../jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS, type TJob, type TJobStatus } from '../../../types';

/**
 * Props used by the jobs summary cards.
 */
interface IJobsSummaryCardsProps {
  jobs: TJob[];
}

/**
 * Statuses with their own summary card. Wishlist and Withdrawn are counted
 * in the total but left out, so the row stays at five cards.
 */
const SUMMARY_STATUSES: TJobStatus[] = ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

/**
 * Renders the saved-job total and the counts of the main statuses, each
 * card topped with its status colour. Counts cover every saved job, not
 * the current search or filter, so they stay put while the list narrows.
 *
 * @param {IJobsSummaryCardsProps} props Component props.
 * @returns {JSX.Element} Jobs summary cards.
 */
const JobsSummaryCardsComponent: FC<IJobsSummaryCardsProps> = ({ jobs }) => {
  const { t } = useTranslation();
  const counts = useMemo(() => {
    const byStatus = new Map<TJobStatus, number>();

    jobs.forEach((job) => byStatus.set(job.status, (byStatus.get(job.status) ?? 0) + 1));

    return byStatus;
  }, [jobs]);

  const cards = [
    { accent: 'bg-primary-600', count: jobs.length, id: 'total', label: t('jobs.summaryTotal') },
    ...SUMMARY_STATUSES.map((status) => ({
      accent: statusSolidClasses[status],
      count: counts.get(status) ?? 0,
      id: status,
      label: t(JOB_STATUS_TRANSLATION_KEYS[status]),
    })),
  ];

  return (
    <dl
      aria-label={t('jobs.summaryLabel')}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"
    >
      {cards.map(({ accent, count, id, label }) => (
        <div
          className="relative overflow-hidden rounded-2xl border border-app-border bg-app-surface p-4 shadow-sm"
          key={id}
        >
          <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
          <dt className="text-sm font-medium text-app-textMuted">{label}</dt>
          <dd className="mt-1 text-3xl font-semibold text-app-text">{count}</dd>
        </div>
      ))}
    </dl>
  );
};

export const JobsSummaryCards = memo(JobsSummaryCardsComponent);
