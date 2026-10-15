import { memo, useMemo, type FC, type ReactNode } from 'react';

import { Button, Card, ErrorState, LoadingState, tileToneClasses } from '../../../components/ui';
import { CalendarIcon } from '../../../components/icons';
import { AgingInsightIcon, ApplicationsInsightIcon, ResponseInsightIcon } from '../dashboard.icons';
import { useLocalToday } from '../../../hooks';
import { useTranslation, type TLanguage } from '../../../i18n';
import { formatInsightRate, getDashboardInsights } from '../dashboardInsights.utils';
import type { AppError } from '../../../errors';
import type { TJob } from '../../../types';
import type { TTimelineEventResponse } from '../../../services';
import type { IApplicationHistory } from '../../statusHistory';

/**
 * Props used by the dashboard insights section.
 */
interface IDashboardInsightsProps {
  /**
   * The application history the page derived from these events, or null
   * while they load or after they fail. Insights need it, so without it
   * the section shows its loading or error state.
   */
  applicationHistory: IApplicationHistory | null;
  error: AppError | null;
  events: TTimelineEventResponse[] | null;
  isLoading: boolean;
  jobs: TJob[];
  onRetry: () => void;
}

/**
 * Background tint of an insight card.
 */
type TInsightTone = 'blue' | 'lavender' | 'mint' | 'peach';

/**
 * Card gradient and icon tile per insight tone. The gradient is a
 * background image, so it layers over the card's own background colour
 * instead of competing with it.
 */
const insightToneClasses: Record<TInsightTone, { card: string; tile: string }> = {
  blue: {
    card: 'bg-linear-to-br from-sky-50 to-app-surface',
    tile: tileToneClasses.blue,
  },
  lavender: {
    card: 'bg-linear-to-br from-primary-50 to-app-surface',
    tile: tileToneClasses.lavender,
  },
  mint: {
    card: 'bg-linear-to-br from-accent-mint to-app-surface',
    tile: tileToneClasses.mint,
  },
  peach: {
    card: 'bg-linear-to-br from-accent-peach to-app-surface',
    tile: tileToneClasses.peach,
  },
};

/**
 * Props used by one compact insight card.
 */
interface IInsightCardProps {
  children?: ReactNode;
  detail: string;
  icon: ReactNode;
  label: string;
  tone: TInsightTone;
  trend?: ReactNode;
  // Greys the value out for a card that holds an explanation, not a result.
  unavailable?: boolean;
  value: string;
}

/**
 * Renders one insight: an icon tile beside its label, then a headline
 * value with an optional trend, a detail line for its period, counts, or
 * explanation, and optional extra content.
 *
 * @param {IInsightCardProps} props Component props.
 * @returns {JSX.Element} Insight card.
 */
const InsightCard: FC<IInsightCardProps> = ({
  children,
  detail,
  icon,
  label,
  tone,
  trend,
  unavailable = false,
  value,
}) => (
  <Card className={insightToneClasses[tone].card}>
    {/* Icon and label share a row so the value below gets the card's full
        width; four cards to a row leave little room beside an icon. */}
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${insightToneClasses[tone].tile}`}
      >
        {icon}
      </span>
      <h3 className="text-sm font-medium text-app-textMuted">{label}</h3>
    </div>
    <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p
        // Words, not a number, so a smaller size keeps them on one line.
        className={`font-semibold ${unavailable ? 'text-xl text-app-textMuted' : 'text-3xl text-app-text'}`}
      >
        {value}
      </p>
      {trend}
    </div>
    <p className="mt-2 text-xs text-app-textMuted">{detail}</p>
    {children}
  </Card>
);

/**
 * Props used by the week-over-week trend.
 */
interface IWeeklyTrendProps {
  current: number;
  previous: number;
}

/**
 * Renders how this week's applications compare with the same days of last
 * week (see `lastWeekToDateCount`): an arrow
 * for the eye and a sentence for everyone, so the arrow is never the only
 * signal.
 *
 * @param {IWeeklyTrendProps} props Applications this week and last week.
 * @returns {JSX.Element} Week-over-week trend.
 */
const WeeklyTrend: FC<IWeeklyTrendProps> = ({ current, previous }) => {
  const { t } = useTranslation();
  const difference = current - previous;

  // With no applications in either span there is nothing to compare.
  if (current === 0 && previous === 0) return null;

  if (difference === 0)
    return <span className="text-sm text-app-textMuted">{t('dashboard.insights.trendSame')}</span>;

  return (
    <span
      className={`text-sm font-semibold ${difference > 0 ? 'text-success-700' : 'text-app-textMuted'}`}
    >
      <span aria-hidden="true">{difference > 0 ? '↑ ' : '↓ '}</span>
      {t(difference > 0 ? 'dashboard.insights.trendUp' : 'dashboard.insights.trendDown', {
        count: Math.abs(difference),
      })}
    </span>
  );
};

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
  applicationHistory,
  error,
  events,
  isLoading,
  jobs,
  onRetry,
}) => {
  const { language, t } = useTranslation();
  const today = useLocalToday();
  const insights = useMemo(
    () =>
      events && applicationHistory
        ? getDashboardInsights(jobs, events, today, applicationHistory)
        : null,
    [applicationHistory, events, jobs, today],
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
          icon={<ApplicationsInsightIcon />}
          label={t('dashboard.insights.applicationsThisWeek')}
          tone="lavender"
          trend={
            <WeeklyTrend
              current={applicationsThisWeek.count}
              previous={applicationsThisWeek.lastWeekToDateCount}
            />
          }
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
          icon={<CalendarIcon className="h-6 w-6" />}
          label={t('dashboard.insights.interviewRate')}
          tone="mint"
          value={
            interviewRate.rate === null
              ? t('dashboard.insights.notEnoughData')
              : formatInsightRate(interviewRate.rate)
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
          icon={<AgingInsightIcon />}
          label={t('dashboard.insights.agingApplications')}
          tone="peach"
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
          icon={<ResponseInsightIcon />}
          label={t('dashboard.insights.responseRate')}
          tone="blue"
          unavailable
          value={t('dashboard.insights.unavailable')}
        />
      </div>
    </section>
  );
};

export const DashboardInsights = memo(DashboardInsightsComponent);
