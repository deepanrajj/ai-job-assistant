import type { IAppRouteHandle, TAppRouteHandleKey } from './routes.types';

/**
 * Stores app shell metadata beside the routes that use it.
 */
export const appRouteHandles = {
  AI_ASSISTANT: {
    title: 'route.aiAssistant.title',
    subtitle: 'route.aiAssistant.subtitle',
  },
  DASHBOARD: {
    title: 'route.dashboard.title',
    subtitle: 'route.dashboard.subtitle',
  },
  JOBS: {
    title: 'route.jobs.title',
    subtitle: 'route.jobs.subtitle',
  },
  JOB_DETAIL: {
    title: 'route.jobDetail.title',
    subtitle: 'route.jobDetail.subtitle',
  },
  JOB_EDIT: {
    title: 'route.jobEdit.title',
    subtitle: 'route.jobEdit.subtitle',
  },
  JOB_NEW: {
    title: 'route.jobNew.title',
    subtitle: 'route.jobNew.subtitle',
  },
  NOT_FOUND: {
    title: 'route.notFound.title',
    subtitle: 'route.notFound.subtitle',
  },
} satisfies Record<TAppRouteHandleKey, IAppRouteHandle>;
