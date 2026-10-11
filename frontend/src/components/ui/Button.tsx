import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';

import { getButtonClassName } from './ui.utils';
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
    className={getButtonClassName({ className, fullWidth, size, variant })}
    disabled={disabled}
    type={type}
    {...props}
  >
    {leftIcon}
    {children}
    {rightIcon}
  </button>
);
