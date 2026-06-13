import { memo, type FC } from 'react';

import { BulletList, Card } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import type { TJobDetail } from '../../../types';

/**
 * Props used by the job detail AI panel.
 */
interface IJobDetailAiPanelProps {
  job: TJobDetail;
}

/**
 * Renders saved AI insights for a job.
 *
 * @param {IJobDetailAiPanelProps} props Component props.
 * @returns {JSX.Element} Job AI panel.
 */
const JobDetailAiPanelComponent: FC<IJobDetailAiPanelProps> = ({ job }) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card title={t('jobDetail.ai.summary')}>
        <p className="text-sm leading-7 text-app-textSoft">{job.aiInsights.summary}</p>
      </Card>

      <Card title={t('jobDetail.ai.strengths')}>
        <BulletList items={job.aiInsights.strengths} />
      </Card>

      <Card className="xl:col-span-2" title={t('jobDetail.ai.gaps')}>
        <BulletList items={job.aiInsights.gaps} markerClassName="bg-warning-800" />
      </Card>
    </div>
  );
};

export const JobDetailAiPanel = memo(JobDetailAiPanelComponent);
