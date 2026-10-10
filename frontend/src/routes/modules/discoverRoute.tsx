import type { FC } from 'react';

import { ComingSoonPage } from '../../pages/comingSoon/ComingSoonPage';
import { DiscoverPage } from '../../pages/discover/DiscoverPage';
import { useSavedSearches } from '../../features/discover/useSavedSearches';
import { useTranslation } from '../../i18n';
import { SAVED_SEARCHES_FEATURE_ENABLED } from '../../features/discover/discover.constants';

/**
 * Renders the Discover page with the saved searches. The route owns the
 * requests, as the other routes do, so the page stays free of MSW.
 *
 * @returns {JSX.Element} Discover route content.
 */
export const DiscoverRouteWithSearches: FC = () => <DiscoverPage {...useSavedSearches()} />;

/**
 * Renders the Discover placeholder, making no request.
 *
 * @returns {JSX.Element} Discover route content.
 */
export const DiscoverRouteComingSoon: FC = () => {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      description={t('route.comingSoon.description')}
      title={t('route.comingSoon.title')}
    />
  );
};

/**
 * The Discover route, chosen once at module load so each variant calls the
 * same hooks on every render. TEMPORARY: collapse to
 * `DiscoverRouteWithSearches` once the task 046 backend lands; see
 * `SAVED_SEARCHES_FEATURE_ENABLED`.
 */
export const Component: FC = SAVED_SEARCHES_FEATURE_ENABLED
  ? DiscoverRouteWithSearches
  : DiscoverRouteComingSoon;
