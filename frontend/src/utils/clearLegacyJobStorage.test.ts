import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearLegacyJobStorage } from './clearLegacyJobStorage';

/**
 * Replaces the `localStorage` getter itself, which is what a browser with
 * site data blocked entirely does. A stub that only throws from
 * `removeItem` cannot reach the property access, and the property access is
 * the half that used to sit outside the guard.
 */
const blockStorageAccess = () => {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('access denied');
    },
  });

  return () => {
    if (descriptor) Object.defineProperty(window, 'localStorage', descriptor);
  };
};

describe('clearLegacyJobStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes the retired job store key and leaves other keys alone', () => {
    window.localStorage.setItem('smart-job-tracker-jobs', '[{"id":"job-001"}]');
    window.localStorage.setItem('language', 'de');

    clearLegacyJobStorage();

    expect(window.localStorage.getItem('smart-job-tracker-jobs')).toBeNull();
    expect(window.localStorage.getItem('language')).toBe('de');
  });

  it('ignores a storage implementation that throws from removeItem', () => {
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('access denied');
    });

    expect(() => clearLegacyJobStorage()).not.toThrow();
    expect(removeItem).toHaveBeenCalledWith('smart-job-tracker-jobs');
  });

  /**
   * The case that matters at startup: `main.tsx` calls this before
   * rendering, so an escaping throw is a blank page rather than a lost
   * cleanup.
   */
  it('ignores a browser that throws on the localStorage property itself', () => {
    const restore = blockStorageAccess();

    try {
      expect(() => clearLegacyJobStorage()).not.toThrow();
    } finally {
      restore();
    }
  });
});
