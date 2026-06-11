import type {
  TAlertVariant,
  TButtonSize,
  TButtonVariant,
  TCardPadding,
  TMetricCardTone,
} from './ui.types';

/**
 * Tailwind class map for alert variants.
 */
export const alertVariantClasses: Record<TAlertVariant, string> = {
  error: 'border-danger-100 bg-danger-50 text-danger-700',
  info: 'border-primary-100 bg-primary-50 text-primary-700',
  success: 'border-success-100 bg-success-50 text-success-700',
};

/**
 * Tailwind class map for button variants.
 */
export const buttonVariantClasses: Record<TButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-500',
  secondary: 'border border-app-border bg-app-surface text-app-text hover:bg-app-surface2',
  ghost: 'text-app-textSoft hover:bg-app-surface2 hover:text-app-text',
  danger: 'bg-danger-700 text-white hover:bg-danger-700/90',
};

/**
 * Tailwind class map for button sizes.
 */
export const buttonSizeClasses: Record<TButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

/**
 * Tailwind class map for card body padding.
 */
export const cardPaddingClasses: Record<TCardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
};

/**
 * Tailwind class map for metric value tones.
 */
export const metricValueClasses: Record<TMetricCardTone, string> = {
  default: 'text-app-text',
  success: 'text-success-700',
};
