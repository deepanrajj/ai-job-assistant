import type { FC, ReactNode } from 'react';

import { classNames } from '../../utils';
import { cardPaddingClasses } from './ui.constants';
import type { TCardPadding } from './ui.types';

/**
 * Props used by the card.
 */
interface ICardProps {
  action?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  padding?: TCardPadding;
  subtitle?: string;
  title?: string;
  /**
   * Gives the title this id and names the card's section by it, making the
   * card a named region. Opt-in, so not every titled card is a landmark.
   */
  titleId?: string;
}

/**
 * Renders a bordered content container with an optional header and action slot.
 *
 * @param {ICardProps} props Component props.
 * @returns {JSX.Element} Card section.
 */
export const Card: FC<ICardProps> = ({
  action,
  bodyClassName = '',
  children,
  className = '',
  headerClassName = '',
  padding = 'md',
  subtitle,
  title,
  titleId,
}) => {
  const hasHeader = Boolean(title || subtitle || action);

  return (
    <section
      aria-labelledby={title && titleId ? titleId : undefined}
      className={classNames(
        'overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm',
        className,
      )}
    >
      {hasHeader && (
        <div
          className={classNames(
            'flex items-start justify-between gap-4 border-b border-app-borderSoft bg-app-surface px-5 py-4',
            headerClassName,
          )}
        >
          <div>
            {title && (
              <h2 className="font-display text-xl font-semibold text-app-text" id={titleId}>
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-sm text-app-textMuted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}

      <div className={classNames(cardPaddingClasses[padding], bodyClassName)}>{children}</div>
    </section>
  );
};
