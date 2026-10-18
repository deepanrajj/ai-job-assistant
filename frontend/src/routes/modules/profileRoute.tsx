import type { FC } from 'react';

import { ComingSoonPage } from '../../pages/comingSoon/ComingSoonPage';
import { ProfilePage } from '../../pages/profile/ProfilePage';
import { MOCK_ACCOUNT_SUMMARY } from '../../features/profile/accountSummary.mock';
import { ProfilePreferencesSection } from '../../features/profile/components/ProfilePreferencesSection';
import { ProfileSummaryCard } from '../../features/profile/components/ProfileSummaryCard';
import { useProfilePreferences } from '../../features/profile/useProfilePreferences';
import { useResumeProfiles } from '../../features/profile/useResumeProfiles';
import { useTranslation } from '../../i18n';
import { classNames } from '../../utils';
import { PREFERENCES_FEATURE_ENABLED } from '../../features/profile/preferences.constants';
import { PROFILES_FEATURE_ENABLED } from '../../features/profile/profile.constants';

/**
 * Renders the resume profile library with its own request.
 *
 * @returns {JSX.Element} Resume profile library.
 */
const ProfileLibraryWithData: FC = () => <ProfilePage {...useResumeProfiles()} />;

/**
 * Renders the skills and preferences section with its own request.
 *
 * @returns {JSX.Element} Preferences section.
 */
const PreferencesSectionWithData: FC = () => (
  <ProfilePreferencesSection {...useProfilePreferences()} />
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
 * Which parts of the Profile page to show.
 */
interface IProfileRouteSectionsProps {
  showLibrary: boolean;
  showPreferences: boolean;
}

/**
 * Renders the Profile page: the account summary card (sample data, see
 * `accountSummary.mock.ts`), then the parts whose backends exist, the
 * resume library (task 044) and the Skills and Job preferences cards
 * (task 045). Each part is its own component with its own request, so
 * leaving one out never changes which hooks the other calls. The route
 * owns the requests, as the other routes do, so the pages stay free of MSW.
 *
 * With both parts, from `xl` the library and Skills share a row and Job
 * preferences takes the row below. While the profile editor is open the
 * grid is one column, so the editor gets the full width and Skills does
 * not sit alone beside an empty column. With one part, its cards take the
 * full width.
 *
 * @param {IProfileRouteSectionsProps} props Component props.
 * @returns {JSX.Element} Profile route content.
 */
export const ProfileRouteSections: FC<IProfileRouteSectionsProps> = ({
  showLibrary,
  showPreferences,
}) => (
  <div className="space-y-6">
    <ProfileSummaryCard account={MOCK_ACCOUNT_SUMMARY} />
    <div
      className={classNames(
        'grid items-start gap-6',
        showLibrary && showPreferences && 'xl:grid-cols-2 xl:has-[[data-editor]]:grid-cols-1',
      )}
    >
      {showLibrary && (
        <div className="min-w-0">
          <ProfileLibraryWithData />
        </div>
      )}
      {showPreferences && <PreferencesSectionWithData />}
    </div>
  </div>
);

/**
 * The parts this build shows. The two flags are independent, since either
 * backend can land first.
 *
 * @returns {JSX.Element} Profile route content.
 */
export const ProfileRouteWithSections: FC = () => (
  <ProfileRouteSections
    showLibrary={PROFILES_FEATURE_ENABLED}
    showPreferences={PREFERENCES_FEATURE_ENABLED}
  />
);

/**
 * The Profile route, chosen once at module load: the placeholder only
 * while both parts are off. TEMPORARY: collapse to both parts once the
 * task 044 and 045 backends land; see `PROFILES_FEATURE_ENABLED` and
 * `PREFERENCES_FEATURE_ENABLED`.
 */
export const Component: FC =
  PROFILES_FEATURE_ENABLED || PREFERENCES_FEATURE_ENABLED
    ? ProfileRouteWithSections
    : ProfileRouteComingSoon;
