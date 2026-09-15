import { describe, expect, it, vi } from 'vitest';

import { clearLegacyJobStorage } from './clearLegacyJobStorage';

describe('clearLegacyJobStorage', () => {
  it('removes the retired job store key', () => {
    window.localStorage.setItem('smart-job-tracker-jobs', '[{"id":"job-001"}]');
    window.localStorage.setItem('language', 'de');

    clearLegacyJobStorage(window.localStorage);

    expect(window.localStorage.getItem('smart-job-tracker-jobs')).toBeNull();
    expect(window.localStorage.getItem('language')).toBe('de');
  });

  /**
   * A private window, or site data blocked outright, throws on access rather
   * than returning null. Startup must not die for a key nothing reads.
   */
  it('ignores a storage implementation that refuses access', () => {
    const storage = {
      removeItem: vi.fn(() => {
        throw new Error('access denied');
      }),
    } as unknown as Storage;

    expect(() => clearLegacyJobStorage(storage)).not.toThrow();
    expect(storage.removeItem).toHaveBeenCalledWith('smart-job-tracker-jobs');
  });
});
