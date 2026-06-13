import { JobDetailAiPanel } from './components/JobDetailAiPanel';
import { JobDetailNotesPanel } from './components/JobDetailNotesPanel';
import { JobDetailOverviewPanel } from './components/JobDetailOverviewPanel';
import { JobDetailTasksPanel } from './components/JobDetailTasksPanel';
import { JobDetailTimelinePanel } from './components/JobDetailTimelinePanel';
import type { TJobDetailPanelComponent } from './jobDetail.types';
import type { IJobDetailTabConfig, TJobDetailTab } from '../../types';

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
 * Maps each job detail tab to the panel component rendered when that tab is active.
 */
export const jobDetailPanelComponents: Record<TJobDetailTab, TJobDetailPanelComponent> = {
  overview: JobDetailOverviewPanel,
  tasks: JobDetailTasksPanel,
  notes: JobDetailNotesPanel,
  timeline: JobDetailTimelinePanel,
  ai: JobDetailAiPanel,
};

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
