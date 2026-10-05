/**
 * Translation keys used for resume profile service fallback errors.
 */
export const PROFILE_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listProfiles: 'profiles.fallbackError.listProfiles',
  createProfile: 'profiles.fallbackError.createProfile',
  updateProfile: 'profiles.fallbackError.updateProfile',
  deleteProfile: 'profiles.fallbackError.deleteProfile',
} as const;

/**
 * Supported resume profile fallback error lookup keys.
 */
export type TProfileFallbackErrorKey = keyof typeof PROFILE_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * The kind of role a resume profile is aimed at.
 */
export type TResumeProfileTargetRole = 'BASE' | 'FRONTEND' | 'BACKEND' | 'FULL_STACK' | 'OTHER';

/**
 * One text entry of a profile: an experience highlight or an education
 * line. `id` is generated once when the entry is added and never changes,
 * however the text is edited or the entry moved, so later AI output can
 * cite the entry it came from.
 */
export type TProfileTextEntry = {
  id: string;
  text: string;
};

/**
 * One link of a profile, such as a portfolio or a GitHub page. `id`
 * follows the same rule as `TProfileTextEntry`. `url` is http(s) only.
 */
export type TProfileLinkEntry = {
  id: string;
  label: string;
  url: string;
};

/**
 * The content of a resume profile: everything except its name, stored by
 * the backend as one JSON document (`profileJson`).
 */
export type TResumeProfileContent = {
  targetRole: TResumeProfileTargetRole;
  summary: string;
  highlights: TProfileTextEntry[];
  education: TProfileTextEntry[];
  links: TProfileLinkEntry[];
  notes: string;
};

/**
 * Wire representation of a resume profile as `/api/resume-profiles`
 * returns it.
 */
export type TResumeProfileResponse = {
  id: string;
  name: string;
  profile: TResumeProfileContent;
  createdAt: string;
  updatedAt: string;
};

/**
 * Request body accepted by `POST /api/resume-profiles` and, as a full
 * replacement, `PUT /api/resume-profiles/{id}`.
 */
export type TSaveResumeProfileRequest = {
  name: string;
  profile: TResumeProfileContent;
};
