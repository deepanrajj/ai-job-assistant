import type { FC } from 'react';

/**
 * Props used by the standalone header briefcase icon.
 */
interface IHeaderBriefcaseIconProps {
  className?: string;
}

/**
 * Renders the decorative briefcase icon used by the standalone header.
 *
 * @param {IHeaderBriefcaseIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Decorative header briefcase icon.
 */
export const HeaderBriefcaseIcon: FC<IHeaderBriefcaseIconProps> = ({ className = 'h-8 w-8' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
    focusable="false"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 3.75h4.5a3 3 0 013 3v1.5h.75A2.25 2.25 0 0120.25 10.5v5.25A2.25 2.25 0 0118 18H6a2.25 2.25 0 01-2.25-2.25V10.5A2.25 2.25 0 016 8.25h.75v-1.5a3 3 0 013-3z"
    />
  </svg>
);
