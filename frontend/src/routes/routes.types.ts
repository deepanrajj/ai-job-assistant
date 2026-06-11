import type { APP_PATHS } from './paths';

/**
 * Represents translation keys displayed in the app shell for a matched route.
 */
export interface IAppRouteHandle {
  title: string;
  subtitle: string;
}

/**
 * Represents every key that requires app shell route metadata.
 */
export type TAppRouteHandleKey = keyof typeof APP_PATHS | 'NOT_FOUND';
