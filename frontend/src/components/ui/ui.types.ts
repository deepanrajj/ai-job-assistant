import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

/**
 * Supported visual variants for inline alerts.
 */
export type TAlertVariant = 'error' | 'info' | 'success';

/**
 * Supported visual variants for buttons.
 */
export type TButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Supported button sizing options.
 */
export type TButtonSize = 'sm' | 'md' | 'lg';

/**
 * Supported card body padding options.
 */
export type TCardPadding = 'none' | 'sm' | 'md';

/**
 * Supported visual tones for metric values.
 */
export type TMetricCardTone = 'default' | 'success';

/**
 * Props for the shared input component.
 */
export interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  error?: string;
  helperText?: string;
  label?: string;
  leftIcon?: ReactNode;
}

/**
 * Props for the shared select component.
 */
export interface ISelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string;
  error?: string;
  helperText?: string;
  label?: string;
  children: ReactNode;
}

/**
 * Props for the shared textarea component.
 */
export interface ITextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  error?: string;
  helperText?: string;
  label?: string;
}
