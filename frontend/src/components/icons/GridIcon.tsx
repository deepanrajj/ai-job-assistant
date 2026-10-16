import { memo, type FC } from 'react';

/**
 * Props used by the shared grid icon.
 */
interface IGridIconProps {
  className?: string;
}

/**
 * Renders the shared decorative grid-view icon, for a layout of cards.
 *
 * @param {IGridIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Grid icon.
 */
const GridIconComponent: FC<IGridIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <rect
      height="5.5"
      rx="1.2"
      stroke="currentColor"
      strokeWidth="1.6"
      width="5.5"
      x="3.5"
      y="3.5"
    />
    <rect
      height="5.5"
      rx="1.2"
      stroke="currentColor"
      strokeWidth="1.6"
      width="5.5"
      x="11"
      y="3.5"
    />
    <rect
      height="5.5"
      rx="1.2"
      stroke="currentColor"
      strokeWidth="1.6"
      width="5.5"
      x="3.5"
      y="11"
    />
    <rect height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" width="5.5" x="11" y="11" />
  </svg>
);

export const GridIcon = memo(GridIconComponent);
