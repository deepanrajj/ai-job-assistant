import type { UIMatch } from 'react-router-dom';

import { appRouteHandles } from './routes.constants';
import type { IAppRouteHandle } from './routes.types';

/**
 * Checks whether a route handle contains the metadata required by the app shell.
 *
 * @param {unknown} handle Route handle value supplied by React Router.
 * @returns {boolean} True when the handle contains route title metadata.
 */
export const isAppRouteHandle = (handle: unknown): handle is IAppRouteHandle => {
  if (!handle || typeof handle !== 'object') return false;

  const routeHandle = handle as Partial<IAppRouteHandle>;
  return typeof routeHandle.title === 'string' && typeof routeHandle.subtitle === 'string';
};

/**
 * Returns the deepest matched route handle containing app shell metadata.
 *
 * @param {UIMatch[]} matches Current route matches from React Router.
 * @returns {IAppRouteHandle} Metadata for the active route.
 */
export const getActiveRouteHandle = (matches: UIMatch[]): IAppRouteHandle => {
  const activeHandle = matches.map((match) => match.handle).findLast(isAppRouteHandle);

  return activeHandle ?? appRouteHandles.DASHBOARD;
};
