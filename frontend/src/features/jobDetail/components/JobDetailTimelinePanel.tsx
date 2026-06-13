import { memo, type FC } from 'react';

import { Card } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import { formatJobDate } from '../../jobs/jobs.utils';
import type { TJobDetail } from '../../../types';

/**
 * Props used by the job detail timeline panel.
 */
interface IJobDetailTimelinePanelProps {
  job: TJobDetail;
}

/**
 * Renders chronological job activity.
 *
 * @param {IJobDetailTimelinePanelProps} props Component props.
 * @returns {JSX.Element} Job timeline panel.
 */
const JobDetailTimelinePanelComponent: FC<IJobDetailTimelinePanelProps> = ({ job }) => {
  const { language, t } = useTranslation();

  return (
    <Card title={t('jobDetail.timeline.title')}>
      <ol className="space-y-4">
        {job.timeline.map((event) => (
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
