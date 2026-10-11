import { memo, type FC, type ReactNode } from 'react';

import { classNames } from '../../utils';
import { alertVariantClasses } from './ui.constants';
import type { TAlertVariant } from './ui.types';

/**
 * Props used by the alert.
 */
interface IAlertProps {
  children: ReactNode;
  className?: string;
  /** False renders a plain notice, not a live region, such as one holding a button. */
  live?: boolean;
  role?: 'alert' | 'status';
  variant?: TAlertVariant;
}

/**
 * Renders a compact accessible message block for errors, status updates, or notices.
 *
 * @param {IAlertProps} props Component props.
 * @returns {JSX.Element} Alert message container.
 */
const AlertComponent: FC<IAlertProps> = ({
  children,
  className = '',
  live = true,
  role = 'alert',
  variant = 'error',
}) => (
  <div
    className={classNames('rounded-lg border p-3 text-sm', alertVariantClasses[variant], className)}
    role={live ? role : undefined}
  >
    {children}
  </div>
);

export const Alert = memo(AlertComponent);
