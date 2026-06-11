import { memo, type FC } from 'react';

import { classNames } from '../../utils';

/**
 * Props used by the shared bullet list.
 */
interface IBulletListProps {
  items: string[];
  markerClassName?: string;
}

/**
 * Renders a list of text items with configurable bullet styling.
 *
 * @param {IBulletListProps} props Component props.
 * @param {string[]} props.items Text items to display.
 * @param {string} props.markerClassName Optional bullet class name.
 * @returns {JSX.Element} Styled bullet list.
 */
const BulletListComponent: FC<IBulletListProps> = ({
  items,
  markerClassName = 'bg-primary-400',
}) => (
  <ul className="space-y-3">
    {items.map((item) => (
      <li className="flex items-start gap-3" key={item}>
        <span
          aria-hidden="true"
          className={classNames('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', markerClassName)}
        />
        <span className="text-sm text-app-textSoft">{item}</span>
      </li>
    ))}
  </ul>
);

export const BulletList = memo(BulletListComponent);
