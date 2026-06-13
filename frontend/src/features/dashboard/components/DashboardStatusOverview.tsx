import { memo, type FC } from 'react';

import { Card } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import { getStatusMeterWidth } from '../dashboard.utils';
import { dashboardStatusOrder } from '../dashboard.constants';
import type { TJobStatusCounts } from '../dashboard.types';
import { JOB_STATUS_TRANSLATION_KEYS } from '../../../types';

/**
 * Props used by the dashboard status overview.
 */
interface IDashboardStatusOverviewProps {
  statusCounts: TJobStatusCounts;
  totalJobCount: number;
}

/**
 * Renders job counts and proportional meters grouped by status.
 *
 * @param {IDashboardStatusOverviewProps} props Component props.
 * @returns {JSX.Element} Dashboard status overview.
 */
const DashboardStatusOverviewComponent: FC<IDashboardStatusOverviewProps> = ({
  statusCounts,
  totalJobCount,
}) => {
  const { t } = useTranslation();

  return (
    <Card title={t('dashboard.statusOverview')}>
      <div className="space-y-4">
        {dashboardStatusOrder.map((status) => {
          const count = statusCounts[status];
          const label = t(JOB_STATUS_TRANSLATION_KEYS[status]);

          return (
            <div key={status}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-app-textSoft">{label}</span>
                <span className="text-app-textMuted">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-app-surface2">
                <div
                  aria-label={label}
                  aria-valuemax={Math.max(totalJobCount, 1)}
                  aria-valuemin={0}
                  aria-valuenow={count}
                  className="h-full rounded-full bg-primary-600"
                  role="meter"
                  style={{ width: getStatusMeterWidth(count, totalJobCount) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const DashboardStatusOverview = memo(DashboardStatusOverviewComponent);
