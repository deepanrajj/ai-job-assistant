import { forwardRef, useId } from 'react';

import { classNames } from '../../utils';
import type { ITextareaProps } from './ui.types';

/**
 * Renders an accessible textarea with optional label, helper text, and error text.
 *
 * @param {ITextareaProps} props Component props.
 * @returns {JSX.Element} Labeled textarea control.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, ITextareaProps>(
  ({ className = '', containerClassName = '', error, helperText, id, label, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const descriptionId = `${textareaId}-description`;
    const hasDescription = Boolean(error || helperText);

    return (
      <div className={classNames('block', containerClassName)}>
        {label && (
          <label
            className="mb-1.5 block text-sm font-medium text-app-textSoft"
            htmlFor={textareaId}
          >
            {label}
          </label>
        )}
        <textarea
          aria-describedby={hasDescription ? descriptionId : undefined}
          aria-invalid={Boolean(error)}
          className={classNames(
            'w-full rounded-lg border bg-app-bg p-4 text-sm text-app-text outline-none transition',
            'placeholder:text-app-textMuted focus:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg',
            error ? 'border-danger-100' : 'border-app-border',
            className,
          )}
          id={textareaId}
          ref={ref}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
