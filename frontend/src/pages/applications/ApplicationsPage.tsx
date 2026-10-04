import { useMemo, type FC } from 'react';
import { Link } from 'react-router-dom';

import { Button, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { groupDocumentsByJob } from '../../features/applications/applications.utils';
import { formatCalendarDate } from '../../features/jobs/jobs.utils';
import type { AppError } from '../../errors';
import { APP_PATH_BUILDERS } from '../../routes/paths';
import { DOCUMENT_TYPE_TRANSLATION_KEYS, type TJob } from '../../types';
import type { TApplicationDocument } from '../../features/applications/applications.types';

/**
 * Props used by the Applications page.
 */
interface IApplicationsPageProps {
  documents: TApplicationDocument[];
  error: AppError | null;
  isLoading: boolean;
  jobs: TJob[];
  onRetry: () => void;
}

/**
 * Lists what was sent with each application: every job that has
 * documents, most recent submission first, with each document's type,
 * version label, link, and submitted date, and a link to the job.
 *
 * @param {IApplicationsPageProps} props Component props.
 * @returns {JSX.Element} Applications page.
 */
export const ApplicationsPage: FC<IApplicationsPageProps> = ({
  documents,
  error,
  isLoading,
  jobs,
  onRetry,
}) => {
  const { language, t } = useTranslation();
  const groups = useMemo(() => groupDocumentsByJob(jobs, documents), [documents, jobs]);

  if (isLoading) return <LoadingState label={t('applications.loading')} />;

  if (error)
    return (
      <ErrorState
        action={<Button onClick={onRetry}>{t('jobs.loadErrorRetry')}</Button>}
        description={error.message}
        title={t('applications.loadErrorTitle')}
      />
    );

  if (groups.length === 0)
    return (
      <Card bodyClassName="p-0" padding="none" title={t('applications.title')}>
        <EmptyState
          description={t('applications.emptyDescription')}
          title={t('applications.emptyTitle')}
        />
      </Card>
    );

  return (
    <div className="space-y-4">
      {groups.map(({ documents: jobDocuments, job }) => (
        <Card
          key={job.id}
          subtitle={job.roleTitle}
          title={job.company}
          action={
            <Link
              aria-label={t('a11y.viewJobDetailsFor', { company: job.company })}
              className="text-sm font-medium text-primary-700 hover:underline"
              to={APP_PATH_BUILDERS.jobDetail(job.id)}
            >
              {t('applications.openJob')}
            </Link>
          }
        >
          <ul
            aria-label={t('applications.documentsFor', { company: job.company })}
            className="divide-y divide-app-border"
          >
            {jobDocuments.map((document) => (
              <li
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                key={document.id}
              >
                <div className="min-w-0">
                  <p className="font-medium text-app-text">{document.title}</p>
                  <p className="text-sm text-app-textMuted">
                    {t(DOCUMENT_TYPE_TRANSLATION_KEYS[document.type])}
                    {document.url && (
                      <>
                        {' · '}
                        <a
                          className="text-primary-700 hover:underline"
                          href={document.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {t('applications.openLink')}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-app-textSoft">
                  {document.submittedAt
                    ? t('jobDetail.documents.submittedOn', {
                        date: formatCalendarDate(document.submittedAt, language),
                      })
                    : t('jobDetail.documents.notSentYet')}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
};
