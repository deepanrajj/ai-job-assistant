import { memo, type FC } from 'react';
import { Link } from 'react-router-dom';

import { Card, EmptyState } from '../../../components/ui';
import { StatusPill } from '../../jobs/components/StatusPill';
import { DashboardViewAllLink } from './DashboardViewAllLink';
import { useBreakpoint } from '../../../hooks';
import { useTranslation } from '../../../i18n';
import { formatDashboardDate } from '../dashboard.utils';
import { APP_PATH_BUILDERS } from '../../../routes/paths';
import type { TJob } from '../../../types';
import type { IRecentApplications } from '../dashboard.types';

/**
 * Props used by the dashboard recent activity list.
 */
interface IDashboardRecentActivityProps {
  /**
   * What status history says about the recent jobs, or null while that
   * history is loading or failed. The table never guesses a date: it says
   * whether one is unavailable, not recorded, or does not apply.
   */
  applications: IRecentApplications | null;
  jobs: TJob[];
  /**
   * True when the card shares its row with another card from `lg` up.
   * A five-column table does not fit half a row, so it uses the cards.
   */
  sharesRow?: boolean;
}

/**
 * Renders the most recently updated jobs. With room for it (from `md` up,
 * unless the card shares a row from `lg` up) they form a table with
 * company, role, recorded application date, status, and update date;
 * otherwise each job is a compact card. Either way, each job links to its
 * detail page and shows its status with the same pill as the jobs list.
 *
 * @param {IDashboardRecentActivityProps} props Component props.
 * @returns {JSX.Element} Dashboard recent activity list.
 */
const DashboardRecentActivityComponent: FC<IDashboardRecentActivityProps> = ({
  applications,
  jobs,
  sharesRow = false,
}) => {
  const { language, t } = useTranslation();
  const isMediumUp = useBreakpoint('md');
  const isLargeUp = useBreakpoint('lg');
  const isTableLayout = isMediumUp && !(sharesRow && isLargeUp);
  const title = t('dashboard.recentActivity');

  if (jobs.length === 0)
    return (
      <Card bodyClassName="p-0" padding="none" title={title}>
        <EmptyState
          description={t('dashboard.noActivityYetDescription')}
          title={t('dashboard.noActivityYet')}
        />
      </Card>
    );

  /**
   * Picks what a missing application date means for screen readers: a
   * wishlist job, or one withdrawn straight from the wishlist, was never
   * applied for; otherwise the date is not recorded, or the history that
   * would hold it is unavailable.
   *
   * @param {TJob} job Job without a recorded application date.
   * @returns {string} Translation key for the missing date.
   */
  const getMissingAppliedKey = (job: TJob): string => {
    if (job.status === 'WISHLIST' || applications?.withdrawnFromWishlist.has(job.id))
      return 'dashboard.notApplied';

    return applications ? 'dashboard.notRecorded' : 'dashboard.appliedUnavailable';
  };

  /**
   * Renders a job's recorded application date, or a dash that tells screen
   * readers why there is none.
   *
   * @param {TJob} job Job to describe.
   * @returns {JSX.Element} Application date or placeholder.
   */
  const renderAppliedDate = (job: TJob) => {
    const appliedAt = applications?.appliedDates.get(job.id);

    if (appliedAt) return formatDashboardDate(appliedAt, language);

    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{t(getMissingAppliedKey(job))}</span>
      </>
    );
  };

  if (isTableLayout)
    return (
      <Card action={<DashboardViewAllLink />} bodyClassName="p-0" padding="none" title={title}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-app-surface2 text-xs font-semibold uppercase tracking-wide text-app-textMuted">
              <tr>
                <th className="px-5 py-3" scope="col">
                  {t('jobs.company')}
                </th>
                <th className="px-5 py-3" scope="col">
                  {t('jobs.role')}
                </th>
                <th className="px-5 py-3" scope="col">
                  {t('dashboard.appliedColumn')}
                </th>
                <th className="px-5 py-3" scope="col">
                  {t('jobs.status')}
                </th>
                <th className="px-5 py-3 text-right" scope="col">
                  {t('jobs.updated')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-5 py-3">
                    <Link
                      className="rounded font-medium text-app-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                      to={APP_PATH_BUILDERS.jobDetail(job.id)}
                    >
                      {job.company}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-app-textSoft">{job.roleTitle}</td>
                  <td className="px-5 py-3 text-app-textSoft">{renderAppliedDate(job)}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={job.status} />
                  </td>
                  <td className="px-5 py-3 text-right text-app-textSoft">
                    {formatDashboardDate(job.updatedAt, language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );

  return (
    <Card action={<DashboardViewAllLink />} bodyClassName="p-0" padding="none" title={title}>
      <ul className="divide-y divide-app-border">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link
              className="grid gap-2 px-5 py-4 transition hover:bg-app-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
              to={APP_PATH_BUILDERS.jobDetail(job.id)}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-app-text">{job.company}</p>
                <p className="truncate text-sm text-app-textMuted">{job.roleTitle}</p>
              </div>
              <div>
                <StatusPill status={job.status} />
              </div>
              <p className="text-sm text-app-textSoft">
                {t('dashboard.updated', {
                  date: formatDashboardDate(job.updatedAt, language),
                })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const DashboardRecentActivity = memo(DashboardRecentActivityComponent);
