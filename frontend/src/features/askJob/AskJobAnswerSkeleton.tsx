import { memo, type FC } from 'react';

/**
 * Props used by the AI answer loading placeholder.
 */
interface IAskJobAnswerSkeletonProps {
  label: string;
}

/**
 * Renders the loading placeholder shown while an AI answer is being generated.
 *
 * @param {IAskJobAnswerSkeletonProps} props Component props.
 * @param {string} props.label Accessible loading label.
 * @returns {JSX.Element} Answer loading skeleton.
 */
const AskJobAnswerSkeletonComponent: FC<IAskJobAnswerSkeletonProps> = ({ label }) => (
  <div
    aria-label={label}
    className="rounded-lg border border-app-border bg-app-surface2 p-4"
    role="status"
  >
    <div className="mb-3 h-4 w-24 animate-pulse rounded bg-app-border" />
    <div className="space-y-2">
      <div className="h-4 animate-pulse rounded bg-app-border" />
      <div className="h-4 animate-pulse rounded bg-app-border" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-app-border" />
    </div>
  </div>
);

export const AskJobAnswerSkeleton = memo(AskJobAnswerSkeletonComponent);
