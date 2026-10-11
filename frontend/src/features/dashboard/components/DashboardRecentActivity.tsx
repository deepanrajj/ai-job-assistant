import { memo, type FC } from 'react';
import { Link } from 'react-router-dom';

import { Card, EmptyState } from '../../../components/ui';
import { StatusPill } from '../../jobs/components/StatusPill';
import { DashboardViewAllLink } from './DashboardViewAllLink';
import { useBreakpoint, useElementWidth, useLocalToday } from '../../../hooks';
import { useTranslation } from '../../../i18n';
import { formatDashboardDate } from '../dashboard.utils';
import { getMissingApplicationReason } from '../dashboardInsights.utils';
import { APP_PATH_BUILDERS } from '../../../routes/paths';
import { RECENT_ACTIVITY_TABLE_MIN_WIDTH } from '../dashboard.constants';
import type { TJob } from '../../../types';
import type { IApplicationHistory, TMissingApplicationReason } from '../dashboardInsights.types';

/**
 * Translation key per missing-application reason.
 */
const MISSING_APPLICATION_KEYS: Record<TMissingApplicationReason, string> = {
  notApplied: 'dashboard.notApplied',
  notRecorded: 'dashboard.notRecorded',
  unavailable: 'dashboard.appliedUnavailable',
};

/**
 * Props used by the dashboard recent activity list.
 */
interface IDashboardRecentActivityProps {
  /**
   * What status history says about the jobs, or null while that history
   * is loading or failed. Dates are never guessed: a missing one says
   * whether it is unavailable, not recorded, or does not apply.
   */
  applicationHistory: IApplicationHistory | null;
  jobs: TJob[];
}

/**
 * Renders the most recently updated jobs. When the card is wide enough
 * for five columns they form a table with company, role, recorded
 * application date, status, and update date; otherwise each job is a
 * compact card. Either way, each job links to its detail page and shows
 * its status with the same pill as the jobs list.
 *
 * The choice follows the card's own width, so it is right wherever the
 * page places the card. Where the width cannot be measured, the `md`
 * viewport breakpoint decides.
 *
 * @param {IDashboardRecentActivityProps} props Component props.
 * @returns {JSX.Element} Dashboard recent activity list.
 */
const DashboardRecentActivityComponent: FC<IDashboardRecentActivityProps> = ({
  applicationHistory,
  jobs,
}) => {
  const { language, t } = useTranslation();
  const today = useLocalToday();
  const [measureRef, width] = useElementWidth();
  const isMediumUp = useBreakpoint('md');
  const isTableLayout = width === null ? isMediumUp : width >= RECENT_ACTIVITY_TABLE_MIN_WIDTH;
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

  const getAppliedAt = (job: TJob): Date | undefined =>
    applicationHistory?.applications.get(job.id)?.appliedAt;

  /**
   * Names a missing application date for screen readers and the cards.
   *
   * @param {TJob} job Job without a recorded application date.
   * @returns {string} Translation key for the missing date.
   */
  const getMissingAppliedKey = (job: TJob): string =>
    MISSING_APPLICATION_KEYS[getMissingApplicationReason(job, applicationHistory)];

  /**
   * Renders a job's recorded application date, or a dash that tells screen
   * readers why there is none.
   *
   * @param {TJob} job Job to describe.
   * @returns {JSX.Element} Application date or placeholder.
   */
  const renderAppliedDate = (job: TJob) => {
    const appliedAt = getAppliedAt(job);

    if (appliedAt) return formatDashboardDate(appliedAt, language, today);

    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{t(getMissingAppliedKey(job))}</span>
      </>
    );
  };

  return (
    <div ref={measureRef}>
      <Card action={<DashboardViewAllLink />} bodyClassName="p-0" padding="none" title={title}>
        {isTableLayout ? (
          <div className="overflow-x-auto">
            {/* The card heading names the table, so it has no second caption. */}
            <table className="w-full text-left text-sm">
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
                      {formatDashboardDate(job.updatedAt, language, today)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ul className="divide-y divide-app-border">
            {jobs.map((job) => {
              const appliedAt = getAppliedAt(job);

              return (
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
                      {appliedAt
                        ? t('dashboard.appliedOn', {
                            date: formatDashboardDate(appliedAt, language, today),
                          })
                        : t('dashboard.appliedMissing', {
                            reason: t(getMissingAppliedKey(job)),
                          })}
                      {' · '}
                      {t('dashboard.updated', {
                        date: formatDashboardDate(job.updatedAt, language, today),
                      })}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export const DashboardRecentActivity = memo(DashboardRecentActivityComponent);
