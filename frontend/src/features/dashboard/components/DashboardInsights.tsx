import { memo, useMemo, type FC, type ReactNode } from 'react';

import { Button, Card, ErrorState, LoadingState } from '../../../components/ui';
import { useTranslation, type TLanguage } from '../../../i18n';
import { getDashboardInsights } from '../dashboardInsights.utils';
import type { AppError } from '../../../errors';
import type { TJob } from '../../../types';
import type { TTimelineEventResponse } from '../../../services';

/**
 * Props used by the dashboard insights section.
 */
interface IDashboardInsightsProps {
  error: AppError | null;
  events: TTimelineEventResponse[] | null;
  isLoading: boolean;
  jobs: TJob[];
  onRetry: () => void;
}

/**
 * Props used by one compact insight card.
 */
interface IInsightCardProps {
  children?: ReactNode;
  detail: string;
  label: string;
  value: string;
}

/**
 * Renders one insight: a label, a headline value, a detail line for its
 * period, counts, or explanation, and optional extra content.
 *
 * @param {IInsightCardProps} props Component props.
 * @returns {JSX.Element} Insight card.
 */
const InsightCard: FC<IInsightCardProps> = ({ children, detail, label, value }) => (
  <Card>
    <h3 className="text-sm font-medium text-app-textMuted">{label}</h3>
    <p className="mt-3 text-3xl font-semibold text-app-text">{value}</p>
    <p className="mt-2 text-xs text-app-textMuted">{detail}</p>
    {children}
  </Card>
);

/**
 * Formats a local calendar date as a short day and month.
 *
 * @param {Date} date Local date to format.
 * @param {TLanguage} language Active app language.
 * @returns {string} Localized short date.
 */
const formatShortDate = (date: Date, language: TLanguage): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(date);

/**
 * Renders job-search insights computed from recorded status history:
 * applications this week, interview rate, aging applications, and an
 * explained, unavailable response rate. Every number names its period or
 * cohort and its counts.
 *
 * History loads apart from the jobs list. While it loads, or after it
 * fails, the section shows that state instead of any number: a partial
 * history must not produce one.
 *
 * @param {IDashboardInsightsProps} props Component props.
 * @returns {JSX.Element} Dashboard insights section.
 */
const DashboardInsightsComponent: FC<IDashboardInsightsProps> = ({
  error,
  events,
  isLoading,
  jobs,
  onRetry,
}) => {
  const { language, t } = useTranslation();
  const insights = useMemo(
    () => (events ? getDashboardInsights(jobs, events, new Date()) : null),
    [events, jobs],
  );

  const heading = (
    <h2 className="text-lg font-semibold text-app-text" id="dashboard-insights-heading">
      {t('dashboard.insights.title')}
    </h2>
  );

  if (isLoading)
    return (
      <section aria-labelledby="dashboard-insights-heading" className="space-y-4">
        {heading}
        <Card>
          <LoadingState label={t('dashboard.insights.loading')} />
        </Card>
      </section>
    );

  if (error || !insights)
    return (
      <section aria-labelledby="dashboard-insights-heading" className="space-y-4">
        {heading}
        <Card>
          <ErrorState
            action={<Button onClick={onRetry}>{t('jobs.loadErrorRetry')}</Button>}
            description={t('dashboard.insights.loadErrorDescription')}
            title={t('dashboard.insights.loadErrorTitle')}
          />
        </Card>
      </section>
    );

  const { agingApplications, applicationsThisWeek, interviewRate } = insights;
  const lastDayOfWeek = new Date(applicationsThisWeek.weekEnd);

  lastDayOfWeek.setDate(lastDayOfWeek.getDate() - 1);

  return (
    <section aria-labelledby="dashboard-insights-heading" className="space-y-4">
      {heading}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          detail={[
            t('dashboard.insights.weekRange', {
              end: formatShortDate(lastDayOfWeek, language),
              start: formatShortDate(applicationsThisWeek.weekStart, language),
            }),
            applicationsThisWeek.unknownDateCount > 0
              ? t('dashboard.insights.unknownDatesExcluded', {
                  count: applicationsThisWeek.unknownDateCount,
                })
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          label={t('dashboard.insights.applicationsThisWeek')}
          value={String(applicationsThisWeek.count)}
        />
        <InsightCard
          detail={
            interviewRate.rate === null
              ? t('dashboard.insights.interviewRateUnavailable')
              : t('dashboard.insights.interviewRateDetail', {
                  interviewed: interviewRate.interviewed,
                  total: interviewRate.cohortSize,
                })
          }
          label={t('dashboard.insights.interviewRate')}
          value={
            interviewRate.rate === null
              ? t('dashboard.insights.notEnoughData')
              : `${Math.round(interviewRate.rate * 100)}%`
          }
        />
        <InsightCard
          detail={[
            t('dashboard.insights.agingDetail'),
            agingApplications.unknownDateCount > 0
              ? t('dashboard.insights.agingUnknown', {
                  count: agingApplications.unknownDateCount,
                })
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          label={t('dashboard.insights.agingApplications')}
          value={String(agingApplications.total)}
        >
          {agingApplications.items.length > 0 && (
            <ul
              aria-label={t('dashboard.insights.agingListLabel')}
              className="mt-3 space-y-1 text-sm"
            >
              {agingApplications.items.map(({ ageDays, job }) => (
                <li className="flex justify-between gap-2" key={job.id}>
                  <span className="truncate text-app-text">{job.company}</span>
                  <span className="shrink-0 text-app-textMuted">
                    {t(ageDays === 1 ? 'dashboard.insights.ageDay' : 'dashboard.insights.ageDays', {
                      count: ageDays,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </InsightCard>
        <InsightCard
          detail={t('dashboard.insights.responseRateUnavailable')}
          label={t('dashboard.insights.responseRate')}
          value={t('dashboard.insights.unavailable')}
        />
      </div>
    </section>
  );
};

export const DashboardInsights = memo(DashboardInsightsComponent);
