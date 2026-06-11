import type { TNavClassNameParams } from './appShell.types';

/**
 * Builds the desktop navigation link class name from the active route state.
 *
 * @param {TNavClassNameParams} params Navigation link state from React Router.
 * @param {boolean} params.isActive Whether the link matches the current route.
 * @returns {string} Desktop navigation link class name.
 */
export const navClassName = ({ isActive }: TNavClassNameParams): string =>
  `flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface ${
    isActive
      ? 'bg-primary-50 text-primary-700'
      : 'text-app-textSoft hover:bg-app-surface2 hover:text-app-text'
  }`;

/**
 * Builds the mobile navigation link class name from the active route state.
 *
 * @param {TNavClassNameParams} params Navigation link state from React Router.
 * @param {boolean} params.isActive Whether the link matches the current route.
 * @returns {string} Mobile navigation link class name.
 */
export const mobileNavClassName = ({ isActive }: TNavClassNameParams): string =>
  `flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface ${
    isActive
      ? 'bg-primary-50 text-primary-700'
      : 'border border-app-border bg-app-surface text-app-textSoft'
  }`;
