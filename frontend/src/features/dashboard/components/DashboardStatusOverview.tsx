import { memo, type FC } from 'react';

import { Card } from '../../../components/ui';
import { DashboardViewAllLink } from './DashboardViewAllLink';
import { useTranslation } from '../../../i18n';
import { getStatusMeterWidth } from '../dashboard.utils';
import { statusSolidClasses } from '../../jobs/jobs.constants';
import { dashboardStatusOrder } from '../dashboard.constants';
import { JOB_STATUS_TRANSLATION_KEYS } from '../../../types';
import type { TJobStatusCounts } from '../dashboard.types';

/**
 * Props used by the dashboard pipeline card.
 */
interface IDashboardStatusOverviewProps {
  activeJobCount: number;
  statusCounts: TJobStatusCounts;
  totalJobCount: number;
}

/**
 * Renders the job pipeline: total and active job counts, then one row per
 * status with its count and a proportional meter. The colours only
 * support the printed counts.
 *
 * @param {IDashboardStatusOverviewProps} props Component props.
 * @returns {JSX.Element} Dashboard pipeline card.
 */
const DashboardStatusOverviewComponent: FC<IDashboardStatusOverviewProps> = ({
  activeJobCount,
  statusCounts,
  totalJobCount,
}) => {
  const { t } = useTranslation();

  return (
    <Card
      action={<DashboardViewAllLink />}
      subtitle={t('dashboard.pipelineSummary', {
        active: activeJobCount,
        total: totalJobCount,
      })}
      title={t('dashboard.pipeline')}
    >
      <ul className="space-y-4">
        {dashboardStatusOrder.map((status) => {
          const count = statusCounts[status];
          const label = t(JOB_STATUS_TRANSLATION_KEYS[status]);

          return (
            <li
              // The bar sits under the label so status names are never cut short,
              // however narrow the pipeline column gets.
              className="grid grid-cols-[0.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 text-sm"
              key={status}
            >
              <span
                aria-hidden="true"
                className={`h-3 w-3 rounded-full ${statusSolidClasses[status]}`}
              />
              <span className="font-medium text-app-textSoft">{label}</span>
              <span className="text-right font-semibold text-app-text">{count}</span>
              <div className="col-span-2 col-start-2 h-2.5 overflow-hidden rounded-full bg-app-surface2">
                <div
                  aria-label={label}
                  aria-valuemax={Math.max(totalJobCount, 1)}
                  aria-valuemin={0}
                  aria-valuenow={count}
                  className={`h-full rounded-full ${statusSolidClasses[status]}`}
                  role="meter"
                  style={{ width: getStatusMeterWidth(count, totalJobCount) }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export const DashboardStatusOverview = memo(DashboardStatusOverviewComponent);
