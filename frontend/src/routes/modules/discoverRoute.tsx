import type { FC } from 'react';

import { ComingSoonPage } from '../../pages/comingSoon/ComingSoonPage';
import { DiscoverPage } from '../../pages/discover/DiscoverPage';
import { ImportCandidatesSection } from '../../features/discover/components/ImportCandidatesSection';
import { useImportCandidates } from '../../features/discover/useImportCandidates';
import { useSavedSearches } from '../../features/discover/useSavedSearches';
import { useJobsList } from '../../features/jobs';
import { useTranslation } from '../../i18n';
import { SAVED_SEARCHES_FEATURE_ENABLED } from '../../features/discover/discover.constants';
import { IMPORT_CANDIDATES_FEATURE_ENABLED } from '../../features/discover/importCandidates.constants';

/**
 * Renders the candidate review section with its own requests: the
 * candidates, and the saved jobs they are checked against for duplicates
 * (task 048).
 *
 * @returns {JSX.Element} Candidate review section.
 */
const CandidatesSectionWithData: FC = () => {
  const { error, isLoading, jobs, reload } = useJobsList();

  return (
    <ImportCandidatesSection {...useImportCandidates()} jobs={{ error, isLoading, jobs, reload }} />
  );
};

/**
 * The candidate review section, or nothing while its backend is pending;
 * chosen once at module load so the hooks above are never called
 * conditionally. TEMPORARY: see `IMPORT_CANDIDATES_FEATURE_ENABLED`.
 */
const CandidatesSection: FC = IMPORT_CANDIDATES_FEATURE_ENABLED
  ? CandidatesSectionWithData
  : () => null;

/**
 * Renders the Discover page: saved searches, and below them the candidate
 * review. The route owns the requests, as the other routes do, so the
 * page stays free of MSW.
 *
 * @returns {JSX.Element} Discover route content.
 */
export const DiscoverRouteWithSearches: FC = () => (
  <div className="space-y-8">
    <DiscoverPage {...useSavedSearches()} />
    <CandidatesSection />
  </div>
);

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
