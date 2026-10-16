import { classNames } from '../../utils';
import { buttonSizeClasses, buttonVariantClasses } from './ui.constants';
import type { TButtonSize, TButtonVariant } from './ui.types';

/**
 * Options for the shared button class name.
 */
interface IButtonClassNameOptions {
  className?: string;
  fullWidth?: boolean;
  size?: TButtonSize;
  variant?: TButtonVariant;
}

/**
 * Builds the shared button classes, so links styled as buttons match `Button`.
 *
 * @param {IButtonClassNameOptions} options Variant, size, width, and extra classes.
 * @returns {string} Button class name.
 */
export const getButtonClassName = ({
  className,
  fullWidth = false,
  size = 'md',
  variant = 'primary',
}: IButtonClassNameOptions = {}): string =>
  classNames(
    'inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg font-medium transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg',
    'disabled:cursor-not-allowed disabled:opacity-60',
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    fullWidth && 'w-full',
    className,
  );

/**
 * Classes for one segment of a segmented view switch, such as the Jobs
 * and Applications views. The selected segment is a light, raised tab
 * rather than a solid button, so the switch does not compete with the
 * page's primary action; the others take the primary tint on hover, as
 * the language switch and sidebar links do.
 *
 * @param {boolean} isSelected Whether the segment's view is shown.
 * @returns {string} Segment class name.
 */
export const getSegmentClassName = (isSelected: boolean): string =>
  classNames(
    'inline-flex h-9 items-center gap-1 rounded-full px-4 text-sm font-semibold transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
    isSelected
      ? 'bg-app-surface text-primary-800 shadow-sm'
      : 'text-app-textSoft hover:bg-primary-50 hover:text-primary-800',
  );
