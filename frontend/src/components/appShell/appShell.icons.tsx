import type { FC } from 'react';

/**
 * Renders the app logo icon used in the sidebar brand block.
 *
 * @returns {JSX.Element} Decorative app logo icon.
 */
export const AppLogoIcon: FC = () => (
  <svg aria-hidden="true" className="h-6 w-6" fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M9.5 6.5h5a2.5 2.5 0 0 1 2.5 2.5v.75h1A2.25 2.25 0 0 1 20.25 12v4A2.25 2.25 0 0 1 18 18.25H6A2.25 2.25 0 0 1 3.75 16v-4A2.25 2.25 0 0 1 6 9.75h1V9a2.5 2.5 0 0 1 2.5-2.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Renders the dashboard navigation icon.
 *
 * @returns {JSX.Element} Decorative dashboard icon.
 */
export const DashboardIcon: FC = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M4 13.5V20h6v-6.5H4ZM14 4v16h6V4h-6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Renders the jobs navigation icon.
 *
 * @returns {JSX.Element} Decorative jobs icon.
 */
export const JobsIcon: FC = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M4 13h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * Renders the Discover navigation icon.
 *
 * @returns {JSX.Element} Decorative Discover icon.
 */
export const DiscoverIcon: FC = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" focusable="false" viewBox="0 0 24 24">
    <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M18.5 18.5 15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * Renders the Applications navigation icon.
 *
 * @returns {JSX.Element} Decorative Applications icon.
 */
export const ApplicationsIcon: FC = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M7 3.75h7.25L18 7.5V19a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 6 19V5A1.25 1.25 0 0 1 7 3.75Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M9 12h6M9 15.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * Renders the Calendar navigation icon.
 *
 * @returns {JSX.Element} Decorative Calendar icon.
 */
export const CalendarIcon: FC = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M5 9.5h14M7.5 4v3M16.5 4v3M6.25 6h11.5A1.75 1.75 0 0 1 19.5 7.75v10.5A1.75 1.75 0 0 1 17.75 20H6.25a1.75 1.75 0 0 1-1.75-1.75V7.75A1.75 1.75 0 0 1 6.25 6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Renders the Profile navigation icon.
 *
 * @returns {JSX.Element} Decorative Profile icon.
 */
export const ProfileIcon: FC = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" focusable="false" viewBox="0 0 24 24">
    <circle cx="12" cy="8.5" r="3.25" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M5.5 19.25a6.5 6.5 0 0 1 13 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
