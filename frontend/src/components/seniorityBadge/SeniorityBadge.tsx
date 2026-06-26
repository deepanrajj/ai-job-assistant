import { memo, type FC } from 'react';

import { Badge } from '../ui';
import { seniorityBadgeClasses } from './seniorityBadge.constants';
import type { TJobSeniority } from '../../types';

/**
 * Props used by the seniority badge.
 */
interface ISeniorityBadgeProps {
  seniority: TJobSeniority;
}

/**
 * Renders a badge for the seniority level returned by job analysis.
 *
 * @param {ISeniorityBadgeProps} props Component props.
 * @param {TJobSeniority} props.seniority Seniority level to display.
 * @returns {JSX.Element} Styled seniority badge.
 */
const SeniorityBadgeComponent: FC<ISeniorityBadgeProps> = ({ seniority }) => (
  <Badge className={`px-3 py-1 text-sm ${seniorityBadgeClasses[seniority]}`}>{seniority}</Badge>
);

export const SeniorityBadge = memo(SeniorityBadgeComponent);
