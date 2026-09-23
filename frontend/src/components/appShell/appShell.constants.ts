import {
  ApplicationsIcon,
  CalendarIcon,
  DashboardIcon,
  DiscoverIcon,
  JobsIcon,
  ProfileIcon,
} from './appShell.icons';
import { APP_PATHS } from '../../routes/paths';
import type { TNavItem } from './appShell.types';

/**
 * Defines the sidebar and mobile navigation items for the app shell, in the
 * final product order `docs/context.md` names them.
 */
export const navItems: TNavItem[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.dashboard',
    path: APP_PATHS.DASHBOARD,
    icon: DashboardIcon,
  },
  {
    id: 'jobs',
    labelKey: 'nav.jobs',
    path: APP_PATHS.JOBS,
    icon: JobsIcon,
  },
  {
    id: 'discover',
    labelKey: 'nav.discover',
    path: APP_PATHS.DISCOVER,
    icon: DiscoverIcon,
  },
  {
    id: 'applications',
    labelKey: 'nav.applications',
    path: APP_PATHS.APPLICATIONS,
    icon: ApplicationsIcon,
  },
  {
    id: 'calendar',
    labelKey: 'nav.calendar',
    path: APP_PATHS.CALENDAR,
    icon: CalendarIcon,
  },
  {
    id: 'profile',
    labelKey: 'nav.profile',
    path: APP_PATHS.PROFILE,
    icon: ProfileIcon,
  },
];
