import { memo, type FC, type HTMLAttributes, type ReactNode } from 'react';

import { classNames } from '../../utils';

/**
 * Props used by the shared badge component.
 */
interface IBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

/**
 * Renders a compact, non-interactive label with shared badge styling.
 *
 * @param {IBadgeProps} props Component props.
 * @returns {JSX.Element} Styled badge label.
 */
const BadgeComponent: FC<IBadgeProps> = ({ children, className, ...props }) => (
  <span
    className={classNames('inline-flex items-center rounded-full font-medium', className)}
    {...props}
  >
    {children}
  </span>
);

export const Badge = memo(BadgeComponent);
