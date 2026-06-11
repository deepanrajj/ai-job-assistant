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
 * Renders the AI assistant navigation icon.
 *
 * @returns {JSX.Element} Decorative AI assistant icon.
 */
export const AiAssistantIcon: FC = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M12 3l1.25 4.25L17.5 8.5l-4.25 1.25L12 14l-1.25-4.25L6.5 8.5l4.25-1.25L12 3Z"
      fill="currentColor"
    />
    <path
      d="M18.5 13l.75 2.25L21.5 16l-2.25.75L18.5 19l-.75-2.25L15.5 16l2.25-.75L18.5 13Z"
      fill="currentColor"
    />
  </svg>
);
