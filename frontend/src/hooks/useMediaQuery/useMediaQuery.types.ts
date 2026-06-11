import { RESPONSIVE_BREAKPOINTS } from './useMediaQuery.constants';

/**
 * Represents the supported responsive breakpoint names.
 */
export type TResponsiveBreakpoint = keyof typeof RESPONSIVE_BREAKPOINTS;

/**
 * Represents a browser media query subscription cleanup function.
 */
export type TMediaQueryUnsubscribe = () => void;

/**
 * Represents the callback React uses when a media query match changes.
 */
export type TMediaQueryStoreChange = () => void;
