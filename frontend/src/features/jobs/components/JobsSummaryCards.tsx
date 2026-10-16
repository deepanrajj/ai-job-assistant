import { memo, useMemo, type FC } from 'react';

import { StatsBar } from '../../../components/ui';
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
 * stats bar, each status marked with its colour. From `sm` up the five
 * counts share one row; on phones the total takes a full-width row and the
 * statuses form a 2x2 grid, so no width leaves an empty slot.
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
    <StatsBar
      className="grid-cols-2 sm:grid-cols-5"
      items={[
        {
          className: 'col-span-2 sm:col-span-1',
          id: 'total',
          label: t('jobs.summaryTotal'),
          value: jobs.length,
        },
        ...SUMMARY_STATUSES.map((status) => ({
          dotClassName: statusSolidClasses[status],
          id: status,
          label: t(JOB_STATUS_TRANSLATION_KEYS[status]),
          value: counts.get(status) ?? 0,
        })),
      ]}
      label={t('jobs.summaryLabel')}
    />
  );
};

export const JobsSummaryCards = memo(JobsSummaryCardsComponent);
