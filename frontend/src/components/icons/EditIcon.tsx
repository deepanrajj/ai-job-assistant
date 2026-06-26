import { memo, type FC } from 'react';

/**
 * Props used by the shared edit icon.
 */
interface IEditIconProps {
  className?: string;
}

/**
 * Renders the shared decorative edit icon.
 *
 * @param {IEditIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Edit icon.
 */
const EditIconComponent: FC<IEditIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path
      d="m12.75 4.75 2.5 2.5M5 15l3.25-.75 6.5-6.5a1.77 1.77 0 0 0-2.5-2.5l-6.5 6.5L5 15Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

export const EditIcon = memo(EditIconComponent);
