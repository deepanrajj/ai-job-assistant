import { describe, expect, it } from 'vitest';

import { APP_PATH_BUILDERS, APP_PATHS } from './paths';

describe('APP_PATH_BUILDERS', () => {
  it('builds job paths under the route patterns they have to match', () => {
    const jobId = '11111111-1111-4111-8111-111111111111';

    expect(APP_PATH_BUILDERS.jobDetail(jobId)).toBe(`${APP_PATHS.JOBS}/${jobId}`);
    expect(APP_PATH_BUILDERS.jobEdit(jobId)).toBe(`${APP_PATHS.JOBS}/${jobId}/edit`);
  });

  it('encodes an id so it stays one path segment', () => {
    // An id reaches these builders from stored or fetched data. Without
    // encoding, one containing a slash would silently address another route.
    expect(APP_PATH_BUILDERS.jobDetail('../ai-assistant')).toBe('/jobs/..%2Fai-assistant');
    expect(APP_PATH_BUILDERS.jobEdit('../ai-assistant')).toBe('/jobs/..%2Fai-assistant/edit');
  });
});
