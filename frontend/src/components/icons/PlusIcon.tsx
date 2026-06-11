import { memo, type FC } from 'react';

/**
 * Props used by the shared plus icon.
 */
interface IPlusIconProps {
  className?: string;
}

/**
 * Renders the shared decorative plus icon.
 *
 * @param {IPlusIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Plus icon.
 */
const PlusIconComponent: FC<IPlusIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
  </svg>
);

export const PlusIcon = memo(PlusIconComponent);
