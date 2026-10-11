import { memo, useId, useMemo, type FC } from 'react';
import { Link } from 'react-router-dom';

import { Button, Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { ReminderDueBadge } from '../../reminders/components/ReminderDueBadge';
import { useLocalToday } from '../../../hooks';
import { useTranslation } from '../../../i18n';
import { getLocalIsoDate, getReminderDueState } from '../../reminders/reminders.utils';
import { formatAgendaDay, groupRemindersByWeek } from '../dashboard.utils';
import { getLocalWeek } from '../dashboardInsights.utils';
import type { AppError } from '../../../errors';
import { APP_PATH_BUILDERS } from '../../../routes/paths';
import { NEXT_REMINDERS_LIMIT } from '../../reminders/reminders.constants';
import { REMINDER_TYPE_TRANSLATION_KEYS, type TJob, type TReminderItem } from '../../../types';
import type { IReminderGroup } from '../dashboard.types';

/**
 * Props used by the dashboard next reminders card.
 */
interface IDashboardNextRemindersProps {
  error: AppError | null;
  isLoading: boolean;
  jobs: TJob[];
  onRetry: () => void;
  reminders: TReminderItem[];
}

/**
 * Renders the earliest open reminders across every job as a weekly agenda:
 * overdue, each day of this week that has reminders, then later. Each
 * reminder links to its job. Loading, failure, and the empty case are
 * handled inside the card, so none of them hides the rest of the dashboard.
 *
 * Only the next `NEXT_REMINDERS_LIMIT` reminders are loaded, so days
 * without reminders are left out rather than shown as free, and a full
 * list says that it is limited.
 *
 * Company and role come from the job list the dashboard already has,
 * rather than from the reminders response, so they are never staler than
 * the rest of the page.
 *
 * @param {IDashboardNextRemindersProps} props Component props.
 * @returns {JSX.Element} Dashboard next reminders card.
 */
const DashboardNextRemindersComponent: FC<IDashboardNextRemindersProps> = ({
  error,
  isLoading,
  jobs,
  onRetry,
  reminders,
}) => {
  const { language, t } = useTranslation();
  const headingIdPrefix = useId();
  const jobsById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);
  const localToday = useLocalToday();
  const today = getLocalIsoDate(localToday);
  const weekEnd = getLocalIsoDate(getLocalWeek(localToday).end);
  const groups = useMemo(
    () => groupRemindersByWeek(reminders, today, weekEnd),
    [reminders, today, weekEnd],
  );
  const title = t('dashboard.nextReminders');

  if (isLoading)
    return (
      <Card title={title}>
        <LoadingState label={t('dashboard.nextRemindersLoading')} />
      </Card>
    );

  if (error)
    return (
      <Card title={title}>
        <ErrorState
          action={<Button onClick={onRetry}>{t('jobs.loadErrorRetry')}</Button>}
          description={error.message}
          title={t('dashboard.nextRemindersErrorTitle')}
        />
      </Card>
    );

  if (reminders.length === 0)
    return (
      <Card bodyClassName="p-0" padding="none" title={title}>
        <EmptyState
          description={t('dashboard.noRemindersDescription')}
          title={t('dashboard.noReminders')}
        />
      </Card>
    );

  /**
   * Names an agenda group: overdue, later, or its day, with today marked.
   *
   * @param {IReminderGroup} group Reminder group to label.
   * @returns {string} Group heading text.
   */
  const getGroupLabel = ({ date, kind }: IReminderGroup): string => {
    if (kind === 'overdue') return t('dashboard.agenda.overdue');
    if (kind === 'later' || !date) return t('dashboard.agenda.later');

    const day = formatAgendaDay(date, language);

    return date === today ? t('dashboard.agenda.today', { date: day }) : day;
  };

  /**
   * Renders one reminder as a link to its job.
   *
   * @param {TReminderItem} item Reminder to render.
   * @returns {JSX.Element} Reminder list item.
   */
  const renderReminder = (item: TReminderItem) => {
    const job = jobsById.get(item.jobId);
    const company = job?.company ?? t('dashboard.unknownJob');
    const dueState = getReminderDueState(item, today);

    return (
      <li key={`${item.source}:${item.id}`}>
        <Link
          aria-label={t('dashboard.viewJobReminders', { company, title: item.title })}
          // items-start keeps the due badge at its own width on phones.
          className="flex flex-col items-start gap-2 px-5 py-3 transition hover:bg-app-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 sm:flex-row sm:items-center sm:justify-between"
          to={APP_PATH_BUILDERS.jobDetail(item.jobId)}
        >
          <div className="min-w-0">
            <p className="font-medium text-app-text">{item.title}</p>
            <p className="text-sm text-app-textMuted">
              {item.type
                ? t(REMINDER_TYPE_TRANSLATION_KEYS[item.type])
                : t('jobDetail.reminders.taskSource')}
              {' · '}
              {job ? `${job.company} - ${job.roleTitle}` : company}
            </p>
          </div>
          {dueState && <ReminderDueBadge dueDate={item.dueDate} dueState={dueState} />}
        </Link>
      </li>
    );
  };

  return (
    <Card bodyClassName="p-0" padding="none" title={title}>
      <div className="divide-y divide-app-border">
        {groups.map((group) => {
          const groupKey = `${group.kind}-${group.date ?? 'none'}`;
          const headingId = `${headingIdPrefix}-${groupKey}`;

          return (
            <div key={groupKey}>
              <h3
                className={`bg-app-surface2 px-5 py-2 text-xs font-semibold uppercase tracking-wide ${
                  group.kind === 'overdue' ? 'text-danger-700' : 'text-app-textMuted'
                }`}
                id={headingId}
              >
                {getGroupLabel(group)}
              </h3>
              <ul aria-labelledby={headingId} className="divide-y divide-app-borderSoft">
                {group.reminders.map(renderReminder)}
              </ul>
            </div>
          );
        })}
      </div>
      {reminders.length >= NEXT_REMINDERS_LIMIT && (
        <p className="border-t border-app-border px-5 py-3 text-xs text-app-textMuted">
          {t('dashboard.agenda.limitNote', { count: NEXT_REMINDERS_LIMIT })}
        </p>
      )}
    </Card>
  );
};

export const DashboardNextReminders = memo(DashboardNextRemindersComponent);
