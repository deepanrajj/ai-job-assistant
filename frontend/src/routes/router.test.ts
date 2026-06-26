import { describe, expect, it } from 'vitest';

import { appRouter } from './router';
import { APP_PATHS } from './paths';

describe('appRouter', () => {
  it('defines lazy route modules for app paths', async () => {
    const rootRoute = appRouter.routes[0];
    const childRoutes = rootRoute.children ?? [];
    const lazyRoutes = childRoutes.filter((route) => route.lazy);

    expect(childRoutes.map((route) => route.path ?? 'index')).toEqual([
      'index',
      APP_PATHS.DASHBOARD,
      APP_PATHS.JOBS,
      APP_PATHS.JOB_NEW,
      APP_PATHS.JOB_EDIT,
      APP_PATHS.JOB_DETAIL,
      APP_PATHS.AI_ASSISTANT,
      '*',
    ]);

    await Promise.all(
      lazyRoutes.map((route) => {
        const lazyRoute = route.lazy as (() => Promise<unknown>) | undefined;
        return lazyRoute?.();
      }),
    );
  });
});
