import { memo, type FC } from 'react';

/**
 * Props used by the shared language icon.
 */
interface ILanguageIconProps {
  className?: string;
}

/**
 * Renders the shared decorative language icon.
 *
 * @param {ILanguageIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Language icon.
 */
const LanguageIconComponent: FC<ILanguageIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path
      d="M3 5h14M7 5c.4 3.4 2.3 6.3 6 8.5M13 5c-.7 4-3 7-7 9M6 16l1.2-3h5.6L14 16M8.2 10h3.6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

export const LanguageIcon = memo(LanguageIconComponent);
