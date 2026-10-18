import { memo, type FC } from 'react';

/**
 * Props used by the shared chevron-left icon.
 */
interface IChevronLeftIconProps {
  className?: string;
}

/**
 * Renders the shared decorative chevron-left icon.
 *
 * @param {IChevronLeftIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Chevron-left icon.
 */
const ChevronLeftIconComponent: FC<IChevronLeftIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path
      d="M12.5 5 7.5 10l5 5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

export const ChevronLeftIcon = memo(ChevronLeftIconComponent);
