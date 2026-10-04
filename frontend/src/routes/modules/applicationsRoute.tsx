import type { FC } from 'react';

import { ApplicationsPage } from '../../pages/applications/ApplicationsPage';
import { ComingSoonPage } from '../../pages/comingSoon/ComingSoonPage';
import { useApplicationDocuments } from '../../features/applications/useApplicationDocuments';
import { useJobsList } from '../../features/jobs';
import { useTranslation } from '../../i18n';
import { DOCUMENTS_FEATURE_ENABLED } from '../../features/documents/documents.constants';

/**
 * Renders the Applications page with every job and every job's documents.
 *
 * The route owns both requests, as the dashboard route does, so the page
 * stays free of MSW. Either failing shows one error with one retry that
 * reloads both, because the page cannot name a document's job without the
 * jobs, nor show anything useful without the documents.
 *
 * @returns {JSX.Element} Applications route content.
 */
export const ApplicationsRouteWithDocuments: FC = () => {
  const jobsList = useJobsList();
  const applicationDocuments = useApplicationDocuments();

  const handleRetry = () => {
    jobsList.reload();
    applicationDocuments.reload();
  };

  return (
    <ApplicationsPage
      documents={applicationDocuments.documents}
      error={jobsList.error ?? applicationDocuments.error}
      isLoading={jobsList.isLoading || applicationDocuments.isLoading}
      jobs={jobsList.jobs}
      onRetry={handleRetry}
    />
  );
};

/**
 * Renders the Applications placeholder, making no request.
 *
 * @returns {JSX.Element} Applications route content.
 */
export const ApplicationsRouteComingSoon: FC = () => {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      description={t('route.comingSoon.description')}
      title={t('route.comingSoon.title')}
    />
  );
};

/**
 * The Applications route, chosen once at module load so each variant calls
 * the same hooks on every render. TEMPORARY: collapse to
 * `ApplicationsRouteWithDocuments` once the task 041 backend lands; see
 * `DOCUMENTS_FEATURE_ENABLED`.
 */
export const Component: FC = DOCUMENTS_FEATURE_ENABLED
  ? ApplicationsRouteWithDocuments
  : ApplicationsRouteComingSoon;
