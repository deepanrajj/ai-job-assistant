import { describe, expect, it } from 'vitest';

import { APP_PATHS } from './paths';
import { appRouter } from './router';

describe('appRouter', () => {
  it('defines lazy route modules for app paths', async () => {
    const rootRoute = appRouter.routes[0];
    const childRoutes = rootRoute.children ?? [];
    const lazyRoutes = childRoutes.filter((route) => route.lazy);

    expect(childRoutes.map((route) => route.path ?? 'index')).toEqual([
      'index',
      APP_PATHS.DASHBOARD,
      APP_PATHS.JOBS,
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
