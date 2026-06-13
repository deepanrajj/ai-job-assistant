import { memo, type FC } from 'react';

import { MetricCard } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import type { TJobStatusCounts } from '../dashboard.types';

/**
 * Props used by the dashboard metric summary.
 */
interface IDashboardMetricsProps {
  activeJobCount: number;
  statusCounts: TJobStatusCounts;
  totalJobCount: number;
}

/**
 * Renders the dashboard's high-level job metrics.
 *
 * @param {IDashboardMetricsProps} props Component props.
 * @returns {JSX.Element} Dashboard metric summary.
 */
const DashboardMetricsComponent: FC<IDashboardMetricsProps> = ({
  activeJobCount,
  statusCounts,
  totalJobCount,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label={t('dashboard.totalJobs')} value={totalJobCount} />
      <MetricCard label={t('dashboard.activePipeline')} value={activeJobCount} />
      <MetricCard label={t('dashboard.interviews')} value={statusCounts.INTERVIEW} />
      <MetricCard label={t('dashboard.offers')} value={statusCounts.OFFER} tone="success" />
    </div>
  );
};

export const DashboardMetrics = memo(DashboardMetricsComponent);
