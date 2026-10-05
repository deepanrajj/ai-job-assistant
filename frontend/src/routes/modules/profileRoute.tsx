import type { FC } from 'react';

import { ComingSoonPage } from '../../pages/comingSoon/ComingSoonPage';
import { ProfilePage } from '../../pages/profile/ProfilePage';
import { ProfilePreferencesSection } from '../../features/profile/components/ProfilePreferencesSection';
import { useProfilePreferences } from '../../features/profile/useProfilePreferences';
import { useResumeProfiles } from '../../features/profile/useResumeProfiles';
import { useTranslation } from '../../i18n';
import { PREFERENCES_FEATURE_ENABLED } from '../../features/profile/preferences.constants';
import { PROFILES_FEATURE_ENABLED } from '../../features/profile/profile.constants';

/**
 * Renders the skills and preferences section with its own request.
 *
 * @returns {JSX.Element} Preferences section.
 */
const PreferencesSectionWithData: FC = () => (
  <ProfilePreferencesSection {...useProfilePreferences()} />
);

/**
 * The preferences section, or nothing while its backend is pending; chosen
 * once at module load so the hooks above are never called conditionally.
 * TEMPORARY: see `PREFERENCES_FEATURE_ENABLED`.
 */
const PreferencesSection: FC = PREFERENCES_FEATURE_ENABLED
  ? PreferencesSectionWithData
  : () => null;

/**
 * Renders the Profile page: the resume profile library, and below it the
 * skills and preferences section. The route owns the requests, as the
 * other routes do, so the page stays free of MSW.
 *
 * @returns {JSX.Element} Profile route content.
 */
export const ProfileRouteWithProfiles: FC = () => (
  <div className="space-y-8">
    <ProfilePage {...useResumeProfiles()} />
    <PreferencesSection />
  </div>
);

/**
 * Renders the Profile placeholder, making no request.
 *
 * @returns {JSX.Element} Profile route content.
 */
export const ProfileRouteComingSoon: FC = () => {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      description={t('route.comingSoon.description')}
      title={t('route.comingSoon.title')}
    />
  );
};

/**
 * The Profile route, chosen once at module load so each variant calls the
 * same hooks on every render. TEMPORARY: collapse to
 * `ProfileRouteWithProfiles` once the task 044 backend lands; see
 * `PROFILES_FEATURE_ENABLED`.
 */
export const Component: FC = PROFILES_FEATURE_ENABLED
  ? ProfileRouteWithProfiles
  : ProfileRouteComingSoon;
