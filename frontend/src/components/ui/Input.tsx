import { forwardRef, useId } from 'react';

import { classNames } from '../../utils';
import type { IInputProps } from './ui.types';

/**
 * Renders an accessible text input with optional label, helper text, error text, and left icon.
 *
 * @param {IInputProps} props Component props.
 * @returns {JSX.Element} Labeled input control.
 */
export const Input = forwardRef<HTMLInputElement, IInputProps>(
  (
    { className = '', containerClassName = '', error, helperText, id, label, leftIcon, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = `${inputId}-description`;
    const hasDescription = Boolean(error || helperText);

    return (
      <div className={classNames('block', containerClassName)}>
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-app-textSoft" htmlFor={inputId}>
            {label}
          </label>
        )}
        <span className="relative block">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-textMuted">
              {leftIcon}
            </span>
          )}
          <input
            aria-describedby={hasDescription ? descriptionId : undefined}
            aria-invalid={Boolean(error)}
            className={classNames(
              'h-11 w-full rounded-lg border bg-app-bg pr-3 text-sm text-app-text outline-none transition',
              'placeholder:text-app-textMuted focus:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg',
              leftIcon ? 'pl-9' : 'pl-3',
              error ? 'border-danger-100' : 'border-app-border',
              className,
            )}
            id={inputId}
            ref={ref}
            {...props}
          />
        </span>
        {hasDescription && (
          <span
            className={`mt-1.5 block text-sm ${error ? 'text-danger-700' : 'text-app-textMuted'}`}
            id={descriptionId}
          >
            {error ?? helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
