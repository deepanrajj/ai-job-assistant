import { memo, type FC } from 'react';

/**
 * Props used by the shared Kanban icon.
 */
interface IKanbanIconProps {
  className?: string;
}

/**
 * Renders the shared decorative Kanban-view icon.
 *
 * @param {IKanbanIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Kanban icon.
 */
const KanbanIconComponent: FC<IKanbanIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <rect height="12" rx="1.2" stroke="currentColor" strokeWidth="1.6" width="4" x="3" y="4" />
    <rect height="8" rx="1.2" stroke="currentColor" strokeWidth="1.6" width="4" x="8" y="4" />
    <rect height="10" rx="1.2" stroke="currentColor" strokeWidth="1.6" width="4" x="13" y="4" />
  </svg>
);

export const KanbanIcon = memo(KanbanIconComponent);
