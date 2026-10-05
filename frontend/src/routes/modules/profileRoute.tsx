import type { FC } from 'react';

import { ComingSoonPage } from '../../pages/comingSoon/ComingSoonPage';
import { ProfilePage } from '../../pages/profile/ProfilePage';
import { useResumeProfiles } from '../../features/profile/useResumeProfiles';
import { useTranslation } from '../../i18n';
import { PROFILES_FEATURE_ENABLED } from '../../features/profile/profile.constants';

/**
 * Renders the Profile page with the resume profile library. The route owns
 * the requests, as the other routes do, so the page stays free of MSW.
 *
 * @returns {JSX.Element} Profile route content.
 */
export const ProfileRouteWithProfiles: FC = () => <ProfilePage {...useResumeProfiles()} />;

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
