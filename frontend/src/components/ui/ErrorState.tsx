import { memo, type FC, type ReactNode } from 'react';

import { classNames } from '../../utils';

/**
 * Props used by the error state.
 */
interface IErrorStateProps {
  action?: ReactNode;
  className?: string;
  description?: string;
  title: string;
}

/**
 * Renders an accessible error fallback for pages, cards, and data panels.
 *
 * @param {IErrorStateProps} props Component props.
 * @returns {JSX.Element} Error state content.
 */
const ErrorStateComponent: FC<IErrorStateProps> = ({
  action,
  className = '',
  description,
  title,
}) => (
  <div
    className={classNames(
      'flex flex-col items-center justify-center rounded-lg border border-danger-100 bg-danger-50 px-5 py-12 text-center',
      className,
    )}
    role="alert"
  >
    <div
      aria-hidden="true"
      className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-app-surface text-danger-700"
    >
      !
    </div>
    <p className="font-medium text-danger-700">{title}</p>
    {description && <p className="mt-1 max-w-md text-sm text-danger-700/80">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = memo(ErrorStateComponent);
