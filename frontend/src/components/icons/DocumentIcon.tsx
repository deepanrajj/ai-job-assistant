import { memo, type FC } from 'react';

/**
 * Props used by the shared document icon.
 */
interface IDocumentIconProps {
  className?: string;
}

/**
 * Renders the shared decorative document icon: a page with a folded
 * corner and text lines.
 *
 * @param {IDocumentIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} Document icon.
 */
const DocumentIconComponent: FC<IDocumentIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
    <path
      d="M11.25 3.25H6.5A1.75 1.75 0 0 0 4.75 5v10c0 .97.78 1.75 1.75 1.75h7c.97 0 1.75-.78 1.75-1.75V7.25l-4-4Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
    <path
      d="M11.25 3.25v4h4M7.75 10.75h4.5M7.75 13.5h3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

export const DocumentIcon = memo(DocumentIconComponent);
