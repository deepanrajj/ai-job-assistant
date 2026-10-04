import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * TEMPORARY: goes with REMINDERS_FEATURE_ENABLED and
 * DOCUMENTS_FEATURE_ENABLED once the task 040 and 041 backends land.
 * Re-imports the constants under each flag value, since the tab list is
 * built when the module loads.
 */
const loadTabIds = async ({
  documentsEnabled,
  remindersEnabled,
}: {
  documentsEnabled: boolean;
  remindersEnabled: boolean;
}): Promise<string[]> => {
  vi.resetModules();
  vi.doMock('../reminders/reminders.constants', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    REMINDERS_FEATURE_ENABLED: remindersEnabled,
  }));
  vi.doMock('../documents/documents.constants', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    DOCUMENTS_FEATURE_ENABLED: documentsEnabled,
  }));

  const { jobDetailTabs } = await import('./jobDetail.constants');

  return jobDetailTabs.map((tab) => tab.id);
};

describe('jobDetailTabs', () => {
  afterEach(() => {
    vi.doUnmock('../reminders/reminders.constants');
    vi.doUnmock('../documents/documents.constants');
  });

  it('lists documents and reminders after contacts while both features are on', async () => {
    expect(await loadTabIds({ documentsEnabled: true, remindersEnabled: true })).toEqual([
      'overview',
      'tasks',
      'notes',
      'contacts',
      'documents',
      'reminders',
      'timeline',
      'ai',
    ]);
  });

  it('leaves the reminders tab out while that feature is off', async () => {
    expect(await loadTabIds({ documentsEnabled: true, remindersEnabled: false })).toEqual([
      'overview',
      'tasks',
      'notes',
      'contacts',
      'documents',
      'timeline',
      'ai',
    ]);
  });

  it('leaves the documents tab out while that feature is off', async () => {
    expect(await loadTabIds({ documentsEnabled: false, remindersEnabled: true })).toEqual([
      'overview',
      'tasks',
      'notes',
      'contacts',
      'reminders',
      'timeline',
      'ai',
    ]);
  });
});
