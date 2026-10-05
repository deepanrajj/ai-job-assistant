import type { TResumeProfileTargetRole } from '../../services';

/**
 * TEMPORARY - remove when the task 044 backend lands.
 *
 * False in built images (`production` mode), where `/api/resume-profiles`
 * does not exist yet: the Profile page stays "coming soon" and no profile
 * request is made. True in the dev server, where `USE_MOCK_PROFILES` stands
 * in for the endpoints, and under Vitest, so the feature stays tested.
 */
export const PROFILES_FEATURE_ENABLED = import.meta.env.MODE !== 'production';

/**
 * Target roles offered for a profile, in display order.
 */
export const RESUME_PROFILE_TARGET_ROLES: readonly TResumeProfileTargetRole[] = [
  'BASE',
  'FRONTEND',
  'BACKEND',
  'FULL_STACK',
  'OTHER',
];

/**
 * Maps each target role to its translation resource key.
 */
export const RESUME_PROFILE_TARGET_ROLE_TRANSLATION_KEYS: Record<TResumeProfileTargetRole, string> =
  {
    BASE: 'profile.targetRole.base',
    FRONTEND: 'profile.targetRole.frontend',
    BACKEND: 'profile.targetRole.backend',
    FULL_STACK: 'profile.targetRole.fullStack',
    OTHER: 'profile.targetRole.other',
  };
