import { RESPONSIVE_BREAKPOINTS } from './useMediaQuery.constants';
import type {
  TMediaQueryStoreChange,
  TMediaQueryUnsubscribe,
  TResponsiveBreakpoint,
} from './useMediaQuery.types';

/**
 * Builds a min-width media query for a named responsive breakpoint.
 *
 * @param {TResponsiveBreakpoint} breakpoint Responsive breakpoint name.
 * @returns {string} Min-width media query.
 */
export const getBreakpointMediaQuery = (breakpoint: TResponsiveBreakpoint): string =>
  `(min-width: ${RESPONSIVE_BREAKPOINTS[breakpoint]})`;

/**
 * Provides the default media query value before browser APIs are available.
 *
 * @returns {boolean} Default server snapshot value.
 */
export const getDefaultMediaQuerySnapshot = (): boolean => false;

/**
 * Reads whether the current browser viewport matches a media query.
 *
 * @param {string} query Browser media query.
 * @returns {boolean} Whether the query currently matches.
 */
export const getMediaQuerySnapshot = (query: string): boolean => window.matchMedia(query).matches;

/**
 * Subscribes React to browser media query changes.
 *
 * @param {string} query Browser media query.
 * @param {TMediaQueryStoreChange} onStoreChange Callback fired when match state changes.
 * @returns {TMediaQueryUnsubscribe} Cleanup callback.
 */
export const subscribeToMediaQuery = (
  query: string,
  onStoreChange: TMediaQueryStoreChange,
): TMediaQueryUnsubscribe => {
  const mediaQueryList = window.matchMedia(query);
  const handleChange = (): void => onStoreChange();

  mediaQueryList.addEventListener('change', handleChange);

  return () => mediaQueryList.removeEventListener('change', handleChange);
};
