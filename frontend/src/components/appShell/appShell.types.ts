import type { ComponentType } from 'react';

import type { TAppPath } from '../../routes/paths';

/**
 * Represents the route ids used by the app shell navigation and page titles.
 */
export type TAppRouteId = 'dashboard' | 'jobs' | 'ai-assistant';

/**
 * Represents a navigation item rendered by the app shell.
 */
export type TNavItem = {
  id: TAppRouteId;
  labelKey: string;
  path: TAppPath;
  icon: ComponentType;
};

/**
 * Represents the route state passed by React Router when styling nav links.
 */
export type TNavClassNameParams = {
  isActive: boolean;
};

/**
 * Represents a class name builder used by app shell navigation links.
 */
export type TNavLinkClassName = (params: TNavClassNameParams) => string;
