import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from '../components/appShell';
import { RouteErrorElement } from './RouteErrorElement';
import { APP_PATHS } from './paths';
import { appRouteHandles } from './routes.constants';

/**
 * Defines the browser router tree for the Smart Job Tracker frontend.
 */
export const appRouter = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        index: true,
        element: <Navigate to={APP_PATHS.DASHBOARD} replace />,
      },
      {
        handle: appRouteHandles.DASHBOARD,
        path: APP_PATHS.DASHBOARD,
        lazy: () => import('./modules/dashboardRoute'),
      },
      {
        handle: appRouteHandles.JOBS,
        path: APP_PATHS.JOBS,
        lazy: () => import('./modules/jobsRoute'),
      },
      {
        handle: appRouteHandles.JOB_NEW,
        path: APP_PATHS.JOB_NEW,
        lazy: () => import('./modules/jobNewRoute'),
      },
      {
        handle: appRouteHandles.JOB_EDIT,
        path: APP_PATHS.JOB_EDIT,
        lazy: () => import('./modules/jobEditRoute'),
      },
      {
        handle: appRouteHandles.JOB_DETAIL,
        path: APP_PATHS.JOB_DETAIL,
        lazy: () => import('./modules/jobDetailRoute'),
      },
      {
        handle: appRouteHandles.AI_ASSISTANT,
        path: APP_PATHS.AI_ASSISTANT,
        lazy: () => import('./modules/analyzeJobRoute'),
      },
      {
        handle: appRouteHandles.NOT_FOUND,
        path: '*',
        lazy: () => import('./modules/notFoundRoute'),
      },
    ],
  },
]);
