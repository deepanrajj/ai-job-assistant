import { memo, type FC } from 'react';

/**
 * Props used by the shared table icon.
 */
interface ITableIconProps {
  className?: string;
}

/**
 * Renders the shared decorative table-view icon.
 *
 * @param {ITableIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Table icon.
 */
const TableIconComponent: FC<ITableIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <rect height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="14" x="3" y="4" />
    <path d="M3 8.5h14M8 8.5v7.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
  </svg>
);

export const TableIcon = memo(TableIconComponent);
