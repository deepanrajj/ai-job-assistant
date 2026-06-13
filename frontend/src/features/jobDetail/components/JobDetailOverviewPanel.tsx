import { memo, type FC } from 'react';

import { Card } from '../../../components/ui';
import { JobTags } from '../../jobs/components/JobTags';
import { useTranslation } from '../../../i18n';
import type { TJobDetail } from '../../../types';

/**
 * Props used by the job detail overview panel.
 */
interface IJobDetailOverviewPanelProps {
  job: TJobDetail;
}

/**
 * Renders the overview tab for a saved job.
 *
 * @param {IJobDetailOverviewPanelProps} props Component props.
 * @returns {JSX.Element} Job overview panel.
 */
const JobDetailOverviewPanelComponent: FC<IJobDetailOverviewPanelProps> = ({ job }) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card title={t('jobDetail.overview.descriptionTitle')}>
        <p className="text-sm leading-7 text-app-textSoft">{job.description}</p>
      </Card>

      <Card title={t('jobDetail.overview.focusTitle')}>
        <p className="text-sm font-medium text-app-text">{job.nextStep}</p>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase text-app-textMuted">
            {t('jobDetail.overview.skills')}
          </p>
          <JobTags tags={job.tags} />
        </div>
      </Card>
    </div>
  );
};

export const JobDetailOverviewPanel = memo(JobDetailOverviewPanelComponent);
