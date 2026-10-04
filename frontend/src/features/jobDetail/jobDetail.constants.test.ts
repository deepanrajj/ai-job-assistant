import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * TEMPORARY: goes with REMINDERS_FEATURE_ENABLED once the task 040
 * backend lands. Re-imports the constants under each flag value, since
 * the tab list is built when the module loads.
 */
const loadTabIds = async (remindersEnabled: boolean): Promise<string[]> => {
  vi.resetModules();
  vi.doMock('../reminders/reminders.constants', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    REMINDERS_FEATURE_ENABLED: remindersEnabled,
  }));

  const { jobDetailTabs } = await import('./jobDetail.constants');

  return jobDetailTabs.map((tab) => tab.id);
};

describe('jobDetailTabs', () => {
  afterEach(() => {
    vi.doUnmock('../reminders/reminders.constants');
  });

  it('lists the reminders tab after contacts while the feature is on', async () => {
    expect(await loadTabIds(true)).toEqual([
      'overview',
      'tasks',
      'notes',
      'contacts',
      'reminders',
      'timeline',
      'ai',
    ]);
  });

  it('leaves the reminders tab out while the feature is off', async () => {
    expect(await loadTabIds(false)).toEqual([
      'overview',
      'tasks',
      'notes',
      'contacts',
      'timeline',
      'ai',
    ]);
  });
});
