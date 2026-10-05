import type { TDuplicateReason } from './duplicates.types';

/**
 * Maps each duplicate rule to the translation key that explains it.
 */
export const DUPLICATE_REASON_TRANSLATION_KEYS: Record<TDuplicateReason, string> = {
  SAME_URL: 'duplicates.reason.sameUrl',
  SAME_COMPANY_AND_ROLE: 'duplicates.reason.sameCompanyAndRole',
  SIMILAR_ROLE_SAME_COMPANY: 'duplicates.reason.similarRoleSameCompany',
  SAME_ROLE_AND_LOCATION: 'duplicates.reason.sameRoleAndLocation',
};
