import type { TNavClassNameParams } from './appShell.types';

/**
 * Builds a sidebar navigation link class name from its active and collapsed state.
 *
 * @param {TNavClassNameParams} params Navigation link state from React Router.
 * @param {boolean} params.isActive Whether the link matches the current route.
 * @param {boolean} params.collapsed Whether the sidebar hides visible labels.
 * @returns {string} Sidebar navigation link class name.
 */
export const navClassName = ({ collapsed = false, isActive }: TNavClassNameParams): string =>
  `flex h-11 items-center gap-3 rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface ${
    collapsed ? 'justify-center px-2' : 'px-3'
  } ${
    isActive
      ? 'bg-primary-100 font-semibold text-primary-900'
      : 'text-app-textSoft hover:bg-primary-50 hover:text-primary-800'
  }`;
