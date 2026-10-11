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
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg',
    'disabled:cursor-not-allowed disabled:opacity-60',
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    fullWidth && 'w-full',
    className,
  );
