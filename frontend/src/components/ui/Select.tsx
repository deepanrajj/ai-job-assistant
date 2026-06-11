import { forwardRef, useId } from 'react';

import { classNames } from '../../utils';
import type { ISelectProps } from './ui.types';

/**
 * Renders an accessible select control with optional label, helper text, and error text.
 *
 * @param {ISelectProps} props Component props.
 * @returns {JSX.Element} Labeled select control.
 */
export const Select = forwardRef<HTMLSelectElement, ISelectProps>(
  (
    { children, className = '', containerClassName = '', error, helperText, id, label, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const descriptionId = `${selectId}-description`;
    const hasDescription = Boolean(error || helperText);

    return (
      <div className={classNames('block', containerClassName)}>
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-app-textSoft" htmlFor={selectId}>
            {label}
          </label>
        )}
        <select
          aria-describedby={hasDescription ? descriptionId : undefined}
          aria-invalid={Boolean(error)}
          className={classNames(
            'h-11 w-full rounded-lg border bg-app-bg px-3 text-sm text-app-text outline-none transition',
            'focus:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg',
            error ? 'border-danger-100' : 'border-app-border',
            className,
          )}
          id={selectId}
          ref={ref}
          {...props}
        >
          {children}
        </select>
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

Select.displayName = 'Select';
