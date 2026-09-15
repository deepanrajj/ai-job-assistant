/**
 * Key the retired localStorage job store wrote to, until task 025 moved the
 * last screen onto the backend and removed `JobsProvider`.
 */
const LEGACY_JOBS_STORAGE_KEY = 'smart-job-tracker-jobs';

/**
 * Removes the retired localStorage job store from a returning browser.
 *
 * Nothing reads the key any more, so left alone it would sit in every
 * existing browser indefinitely. Clearing it on startup keeps a stale copy
 * of job data from outliving the store that wrote it.
 *
 * Storage can throw rather than return null - a private window, or site
 * data blocked entirely - and a browser that cannot reach storage has
 * nothing to clear, so a failure here is not worth surfacing.
 *
 * @param {Storage} storage Browser storage implementation.
 * @returns {void}
 */
export const clearLegacyJobStorage = (storage: Storage): void => {
  try {
    storage.removeItem(LEGACY_JOBS_STORAGE_KEY);
  } catch {
    // A browser that refuses storage access holds no stale key to remove.
  }
};
