import { memo, type FC } from 'react';

/**
 * Props used by the shared trash icon.
 */
interface ITrashIconProps {
  className?: string;
}

/**
 * Renders the shared decorative trash icon.
 *
 * @param {ITrashIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Trash icon.
 */
const TrashIconComponent: FC<ITrashIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path
      d="M7.25 5.25V4.5A1.5 1.5 0 0 1 8.75 3h2.5a1.5 1.5 0 0 1 1.5 1.5v.75M4.75 5.25h10.5M6 7.5l.5 8A1.5 1.5 0 0 0 8 17h4a1.5 1.5 0 0 0 1.5-1.5l.5-8M8.5 9.25v5M11.5 9.25v5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

export const TrashIcon = memo(TrashIconComponent);
