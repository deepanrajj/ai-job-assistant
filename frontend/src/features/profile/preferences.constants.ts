import type { TSeniorityLevel, TWorkMode } from '../../services';

/**
 * TEMPORARY - remove when the task 045 backend lands.
 *
 * False in built images (`production` mode), where
 * `/api/profile/preferences` does not exist yet: the skills and
 * preferences section is left out and no request is made. True in the dev
 * server, where `USE_MOCK_PREFERENCES` stands in for the endpoint, and
 * under Vitest. Independent of `PROFILES_FEATURE_ENABLED`, since the two
 * backends can land in either order.
 */
export const PREFERENCES_FEATURE_ENABLED = import.meta.env.MODE !== 'production';

/**
 * Work modes offered, in display order.
 */
export const WORK_MODE_OPTIONS: readonly TWorkMode[] = ['REMOTE', 'HYBRID', 'ONSITE'];

/**
 * Maps each work mode to its translation resource key.
 */
export const WORK_MODE_TRANSLATION_KEYS: Record<TWorkMode, string> = {
  REMOTE: 'preferences.workMode.remote',
  HYBRID: 'preferences.workMode.hybrid',
  ONSITE: 'preferences.workMode.onsite',
};

/**
 * Seniority levels offered, in display order.
 */
export const SENIORITY_OPTIONS: readonly TSeniorityLevel[] = ['JUNIOR', 'MID', 'SENIOR', 'LEAD'];

/**
 * Maps each seniority level to its translation resource key.
 */
export const SENIORITY_TRANSLATION_KEYS: Record<TSeniorityLevel, string> = {
  JUNIOR: 'preferences.seniority.junior',
  MID: 'preferences.seniority.mid',
  SENIOR: 'preferences.seniority.senior',
  LEAD: 'preferences.seniority.lead',
};
