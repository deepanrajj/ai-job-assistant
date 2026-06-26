import { memo, type FC } from 'react';

/**
 * Props used by the shared arrow-left icon.
 */
interface IArrowLeftIconProps {
  className?: string;
}

/**
 * Renders the shared decorative arrow-left icon.
 *
 * @param {IArrowLeftIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Arrow-left icon.
 */
const ArrowLeftIconComponent: FC<IArrowLeftIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path
      d="M12.5 5 7.5 10l5 5M8 10h8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

export const ArrowLeftIcon = memo(ArrowLeftIconComponent);
