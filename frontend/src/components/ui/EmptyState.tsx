import { memo, type FC, type ReactNode } from 'react';

/**
 * Props used by the empty state.
 */
interface IEmptyStateProps {
  action?: ReactNode;
  description?: string;
  icon?: ReactNode;
  title: string;
}

/**
 * Renders a centered fallback state when a list or panel has no content.
 *
 * @param {IEmptyStateProps} props Component props.
 * @returns {JSX.Element} Empty state content.
 */
const EmptyStateComponent: FC<IEmptyStateProps> = ({ action, description, icon, title }) => (
  <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
    {icon && (
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-app-surface2 text-app-textMuted">
        {icon}
      </div>
    )}
    <p className="font-medium text-app-text">{title}</p>
    {description && <p className="mt-1 max-w-md text-sm text-app-textMuted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const EmptyState = memo(EmptyStateComponent);
