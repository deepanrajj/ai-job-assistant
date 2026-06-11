import { useCallback, useSyncExternalStore } from 'react';

import {
  getBreakpointMediaQuery,
  getDefaultMediaQuerySnapshot,
  getMediaQuerySnapshot,
  subscribeToMediaQuery,
} from './useMediaQuery.utils';
import type { TResponsiveBreakpoint } from './useMediaQuery.types';

/**
 * Tracks whether a browser media query currently matches.
 *
 * @param {string} query Browser media query.
 * @returns {boolean} Whether the query currently matches.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToMediaQuery(query, onStoreChange),
    [query],
  );
  const getSnapshot = useCallback(() => getMediaQuerySnapshot(query), [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getDefaultMediaQuerySnapshot);
};

/**
 * Tracks whether the viewport is at least the selected responsive breakpoint.
 *
 * @param {TResponsiveBreakpoint} breakpoint Responsive breakpoint name.
 * @returns {boolean} Whether the viewport matches the breakpoint.
 */
export const useBreakpoint = (breakpoint: TResponsiveBreakpoint): boolean =>
  useMediaQuery(getBreakpointMediaQuery(breakpoint));
