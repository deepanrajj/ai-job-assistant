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
 * Reaching storage is inside the `try` rather than at the call site because
 * a browser with site data blocked entirely throws on the `localStorage`
 * property access itself, before any method runs. Taking storage as an
 * argument moved that access outside the guard, where a throw would reach
 * `main.tsx` and stop the app rendering at all. A browser that cannot reach
 * storage holds no stale key, so there is nothing here worth surfacing.
 *
 * @returns {void}
 */
export const clearLegacyJobStorage = (): void => {
  try {
    window.localStorage.removeItem(LEGACY_JOBS_STORAGE_KEY);
  } catch {
    // A browser that refuses storage access holds no stale key to remove.
  }
};
