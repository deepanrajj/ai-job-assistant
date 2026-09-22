import { memo, type FC } from 'react';

import { Button, Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { useJobTimeline } from '../useJobTimeline';
import { useTranslation } from '../../../i18n';
import { formatJobDate } from '../../jobs/jobs.utils';

/**
 * Props used by the job detail timeline panel.
 */
interface IJobDetailTimelinePanelProps {
  jobId: string;
}

/**
 * Renders a job's timeline events against the backend.
 *
 * @param {IJobDetailTimelinePanelProps} props Component props.
 * @returns {JSX.Element} Job timeline panel.
 */
const JobDetailTimelinePanelComponent: FC<IJobDetailTimelinePanelProps> = ({ jobId }) => {
  const { language, t } = useTranslation();
  const { events, isLoading, loadError, reload } = useJobTimeline(jobId);

  if (isLoading)
    return (
      <Card title={t('jobDetail.timeline.title')}>
        <LoadingState label={t('jobDetail.timeline.loading')} />
      </Card>
    );

  if (loadError)
    return (
      <Card title={t('jobDetail.timeline.title')}>
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError.message}
          title={t('jobDetail.timeline.loadErrorTitle')}
        />
      </Card>
    );

  if (events.length === 0)
    return (
      <Card title={t('jobDetail.timeline.title')}>
        <EmptyState
          description={t('jobDetail.timeline.emptyDescription')}
          title={t('jobDetail.timeline.empty')}
        />
      </Card>
    );

  return (
    <Card title={t('jobDetail.timeline.title')}>
      <ol className="space-y-4">
        {events.map((event) => (
          <li className="flex gap-3" key={event.id}>
            <span
              aria-hidden="true"
              className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-600"
            />
            <div>
              <p className="text-sm font-medium text-app-text">{event.title}</p>
              <p className="mt-1 text-sm leading-6 text-app-textSoft">{event.description}</p>
              <p className="mt-2 text-xs text-app-textMuted">
                {formatJobDate(event.createdAt, language)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
};

export const JobDetailTimelinePanel = memo(JobDetailTimelinePanelComponent);
