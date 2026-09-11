import { memo, type FC } from 'react';

import { Card } from '../../../components/ui';
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
    <Card title={t('jobDetail.overview.descriptionTitle')}>
      <p className="text-sm leading-7 text-app-textSoft">{job.description}</p>
    </Card>
  );
};

export const JobDetailOverviewPanel = memo(JobDetailOverviewPanelComponent);
