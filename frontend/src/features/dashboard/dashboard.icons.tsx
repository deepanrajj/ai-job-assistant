import type { FC } from 'react';

/**
 * Renders the document icon for the applications-this-week insight.
 *
 * @returns {JSX.Element} Decorative document icon.
 */
export const ApplicationsInsightIcon: FC = () => (
  <svg aria-hidden="true" className="h-6 w-6" fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M14 3.75H7.75a2 2 0 0 0-2 2v12.5a2 2 0 0 0 2 2h8.5a2 2 0 0 0 2-2V8L14 3.75ZM14 3.75V8h4.25M9 12.5h6M9 16h4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Renders the clock icon for the aging-applications insight.
 *
 * @returns {JSX.Element} Decorative clock icon.
 */
export const AgingInsightIcon: FC = () => (
  <svg aria-hidden="true" className="h-6 w-6" fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M12 7.5V12l3 2M20.25 12a8.25 8.25 0 1 1-16.5 0 8.25 8.25 0 0 1 16.5 0Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Renders the speech-bubble icon for the response-rate insight.
 *
 * @returns {JSX.Element} Decorative speech-bubble icon.
 */
export const ResponseInsightIcon: FC = () => (
  <svg aria-hidden="true" className="h-6 w-6" fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M7.5 18.25 4.75 20.5v-4.1A7.25 7.25 0 0 1 3.75 12.5c0-4.14 3.7-7.5 8.25-7.5s8.25 3.36 8.25 7.5-3.7 7.5-8.25 7.5c-1.6 0-3.1-.42-4.5-1.75Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);
