import { memo, useMemo, type FC } from 'react';
import { Link } from 'react-router-dom';

import { Button, Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { ReminderDueBadge } from '../../reminders/components/ReminderDueBadge';
import { useLocalToday } from '../../../hooks';
import { useTranslation } from '../../../i18n';
import { getLocalIsoDate, getReminderDueState } from '../../reminders/reminders.utils';
import type { AppError } from '../../../errors';
import { APP_PATH_BUILDERS } from '../../../routes/paths';
import { REMINDER_TYPE_TRANSLATION_KEYS, type TJob, type TReminderItem } from '../../../types';

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
 * Renders the earliest open reminders across every job, each linking to
 * its job. Loading, failure, and the empty case are handled inside the
 * card, so none of them hides the rest of the dashboard.
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
  const { t } = useTranslation();
  const jobsById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);
  const today = getLocalIsoDate(useLocalToday());
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

  return (
    <Card bodyClassName="p-0" padding="none" title={title}>
      <ul className="divide-y divide-app-border">
        {reminders.map((item) => {
          const job = jobsById.get(item.jobId);
          const company = job?.company ?? t('dashboard.unknownJob');
          const dueState = getReminderDueState(item, today);

          return (
            <li key={`${item.source}:${item.id}`}>
              <Link
                aria-label={t('dashboard.viewJobReminders', { company, title: item.title })}
                className="flex flex-col gap-2 px-5 py-4 transition hover:bg-app-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 sm:flex-row sm:items-center sm:justify-between"
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
        })}
      </ul>
    </Card>
  );
};

export const DashboardNextReminders = memo(DashboardNextRemindersComponent);
