import { describe, expect, it } from 'vitest';
import type { UIMatch } from 'react-router-dom';

import { appRouteHandles } from './routes.constants';
import { getActiveRouteHandle, isAppRouteHandle } from './routes.utils';

describe('routes.utils', () => {
  it('identifies app route handles', () => {
    expect(isAppRouteHandle(appRouteHandles.JOBS)).toBe(true);
    expect(isAppRouteHandle({ title: 'route.jobs.title' })).toBe(false);
    expect(isAppRouteHandle(null)).toBe(false);
  });

  it('returns the deepest route handle from route matches', () => {
    const matches = [
      {
        handle: appRouteHandles.DASHBOARD,
      },
      {
        handle: appRouteHandles.JOBS,
      },
    ] as UIMatch[];

    expect(getActiveRouteHandle(matches)).toBe(appRouteHandles.JOBS);
  });

  it('falls back to dashboard metadata when no match has a route handle', () => {
    expect(getActiveRouteHandle([{ handle: undefined }] as UIMatch[])).toBe(
      appRouteHandles.DASHBOARD,
    );
  });
});
