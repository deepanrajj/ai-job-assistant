import { memo, type FC } from 'react';

/**
 * Props used by the shared chevron-right icon.
 */
interface IChevronRightIconProps {
  className?: string;
}

/**
 * Renders the shared decorative chevron-right icon.
 *
 * @param {IChevronRightIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Chevron-right icon.
 */
const ChevronRightIconComponent: FC<IChevronRightIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path
      d="m7.5 5 5 5-5 5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

export const ChevronRightIcon = memo(ChevronRightIconComponent);
