import { memo, type FC } from 'react';

/**
 * Props used by the shared details icon.
 */
interface IDetailsIconProps {
  className?: string;
}

/**
 * Renders the shared decorative details icon.
 *
 * @param {IDetailsIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Details icon.
 */
const DetailsIconComponent: FC<IDetailsIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path
      d="M4 10s2.25-4 6-4 6 4 6 4-2.25 4-6 4-6-4-6-4Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
    <path
      d="M10 11.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

export const DetailsIcon = memo(DetailsIconComponent);
