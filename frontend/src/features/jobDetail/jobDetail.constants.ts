import type { IJobDetailTabConfig } from '../../types';

/**
 * Defines the tab order and translation keys used by the job detail page.
 */
export const jobDetailTabs = [
  {
    id: 'overview',
    labelKey: 'jobDetail.tabs.overview',
  },
  {
    id: 'tasks',
    labelKey: 'jobDetail.tabs.tasks',
  },
  {
    id: 'notes',
    labelKey: 'jobDetail.tabs.notes',
  },
  {
    id: 'timeline',
    labelKey: 'jobDetail.tabs.timeline',
  },
  {
    id: 'ai',
    labelKey: 'jobDetail.tabs.ai',
  },
] satisfies IJobDetailTabConfig[];

/**
 * Tailwind classes shared by all job detail tab buttons.
 */
export const jobDetailTabButtonClassName = 'h-10 shrink-0 cursor-pointer px-3';

/**
 * Tailwind classes applied to the active job detail tab button.
 */
export const activeJobDetailTabButtonClassName =
  'bg-primary-50 text-primary-700 hover:bg-primary-50 hover:text-primary-700';

/**
 * Tailwind classes applied to inactive job detail tab buttons.
 */
export const inactiveJobDetailTabButtonClassName =
  'text-app-textSoft hover:bg-app-surface2 hover:text-app-text';
