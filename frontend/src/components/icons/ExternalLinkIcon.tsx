import { memo, type FC } from 'react';

/**
 * Props used by the shared external link icon.
 */
interface IExternalLinkIconProps {
  className?: string;
}

/**
 * Renders the shared decorative external link icon.
 *
 * @param {IExternalLinkIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @returns {JSX.Element} External link icon.
 */
const ExternalLinkIconComponent: FC<IExternalLinkIconProps> = ({ className = 'h-3 w-3' }) => (
  <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 16 16">
    <path
      d="M6 4h6v6M12 4 5 11"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

export const ExternalLinkIcon = memo(ExternalLinkIconComponent);
