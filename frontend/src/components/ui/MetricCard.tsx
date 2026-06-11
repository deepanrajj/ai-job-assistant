import { memo, type FC, type ReactNode } from 'react';

import { Card } from './Card';
import { metricValueClasses } from './ui.constants';
import type { TMetricCardTone } from './ui.types';

/**
 * Props used by the metric card.
 */
interface IMetricCardProps {
  label: string;
  value: ReactNode;
  tone?: TMetricCardTone;
}

/**
 * Renders a compact metric card with a label and highlighted value.
 *
 * @param {IMetricCardProps} props Component props.
 * @param {string} props.label Label shown above the metric value.
 * @param {ReactNode} props.value Metric value or custom content to display.
 * @param {"default" | "success"} [props.tone] Optional visual tone for the value text.
 * @returns {JSX.Element} Metric summary card.
 */
const MetricCardComponent: FC<IMetricCardProps> = ({ label, value, tone = 'default' }) => (
  <Card>
    <p className="text-sm font-medium text-app-textMuted">{label}</p>
    <p className={`mt-3 text-3xl font-semibold ${metricValueClasses[tone]}`}>{value}</p>
  </Card>
);

export const MetricCard = memo(MetricCardComponent);
