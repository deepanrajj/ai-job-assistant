import { memo, type FC } from 'react';

/**
 * Props used by the shared search icon.
 */
interface ISearchIconProps {
  className?: string;
}

/**
 * Renders the shared decorative search icon.
 *
 * @param {ISearchIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Search icon.
 */
const SearchIconComponent: FC<ISearchIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path
      d="m14 14 3 3M8.5 15a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

export const SearchIcon = memo(SearchIconComponent);
