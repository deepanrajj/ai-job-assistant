import { AiAssistantIcon, DashboardIcon, JobsIcon } from './appShell.icons';
import { APP_PATHS } from '../../routes/paths';
import type { TNavItem } from './appShell.types';

/**
 * Defines the sidebar and mobile navigation items for the app shell.
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
    id: 'ai-assistant',
    labelKey: 'nav.aiAssistant',
    path: APP_PATHS.AI_ASSISTANT,
    icon: AiAssistantIcon,
  },
];
