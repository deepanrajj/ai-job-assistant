import { memo, type FC } from 'react';

/**
 * Props used by the shared calendar icon.
 */
interface ICalendarIconProps {
  className?: string;
}

/**
 * Renders the shared decorative calendar icon, used by the Calendar
 * navigation link and the dashboard's interview-rate insight.
 *
 * @param {ICalendarIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Calendar icon.
 */
const CalendarIconComponent: FC<ICalendarIconProps> = ({ className = 'h-5 w-5' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 24 24">
    <path
      d="M5 9.5h14M7.5 4v3M16.5 4v3M6.25 6h11.5A1.75 1.75 0 0 1 19.5 7.75v10.5A1.75 1.75 0 0 1 17.75 20H6.25a1.75 1.75 0 0 1-1.75-1.75V7.75A1.75 1.75 0 0 1 6.25 6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CalendarIcon = memo(CalendarIconComponent);
