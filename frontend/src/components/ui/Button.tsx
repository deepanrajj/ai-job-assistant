import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';

import { classNames } from '../../utils';
import { buttonSizeClasses, buttonVariantClasses } from './ui.constants';
import type { TButtonSize, TButtonVariant } from './ui.types';

/**
 * Props used by the button.
 */
interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TButtonVariant;
  size?: TButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/**
 * Renders a styled button with optional icon slots and shared size/variant styling.
 *
 * @param {IButtonProps} props Component props.
 * @returns {JSX.Element} Button element.
 */
export const Button: FC<IButtonProps> = ({
  children,
  className = '',
  disabled,
  fullWidth = false,
  leftIcon,
  rightIcon,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) => (
  <button
    className={classNames(
      'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg',
      'disabled:cursor-not-allowed disabled:opacity-60',
      buttonVariantClasses[variant],
      buttonSizeClasses[size],
      fullWidth && 'w-full',
      className,
    )}
    disabled={disabled}
    type={type}
    {...props}
  >
    {leftIcon}
    {children}
    {rightIcon}
  </button>
);
