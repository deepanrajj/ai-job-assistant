import { memo, type FC } from 'react';

import { classNames } from '../../utils';

/**
 * Props used by the loading state.
 */
interface ILoadingStateProps {
  className?: string;
  description?: string;
  label: string;
}

/**
 * Renders an accessible loading region for pages, cards, and data panels.
 *
 * @param {ILoadingStateProps} props Component props.
 * @returns {JSX.Element} Loading state content.
 */
const LoadingStateComponent: FC<ILoadingStateProps> = ({ className = '', description, label }) => (
  <div
    aria-busy="true"
    aria-live="polite"
    className={classNames(
      'flex flex-col items-center justify-center rounded-lg border border-app-border bg-app-surface px-5 py-12 text-center',
      className,
    )}
    role="status"
  >
    <span
      aria-hidden="true"
      className="mb-4 h-9 w-9 animate-spin rounded-full border-2 border-app-border border-t-primary-600"
    />
    <p className="font-medium text-app-text">{label}</p>
    {description && <p className="mt-1 max-w-md text-sm text-app-textMuted">{description}</p>}
  </div>
);

export const LoadingState = memo(LoadingStateComponent);
