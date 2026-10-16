import type { FC } from 'react';

import { JobDetailAction } from '../../jobs/components/JobDetailAction';
import { StatusPill } from '../../jobs/components/StatusPill';
import { ApplicationDocumentItem } from './ApplicationDocumentItem';
import { useTranslation } from '../../../i18n';
import { APP_PATH_BUILDERS } from '../../../routes/paths';
import type { IApplicationGroup } from '../applications.types';

/**
 * Props used by the application cards.
 */
interface IApplicationCardsProps {
  groups: IApplicationGroup[];
}

/**
 * Shows each job with documents as a card in a grid: company, role, the
 * job's status, then its documents, each with a sent or not-sent marker,
 * the version label, a type badge, the submitted date or "Not sent yet",
 * and its link, and an "Open job" button at the foot. One column on
 * phones, two from `sm`, three from `2xl`.
 *
 * @param {IApplicationCardsProps} props Component props.
 * @returns {JSX.Element} Application cards.
 */
export const ApplicationCards: FC<IApplicationCardsProps> = ({ groups }) => {
  const { t } = useTranslation();

  return (
    <ul className="grid gap-4 p-5 sm:grid-cols-2 2xl:grid-cols-3">
      {groups.map(({ documents, job }) => (
        <li
          className="flex min-w-0 flex-col rounded-xl border border-app-border bg-app-surface p-4 shadow-sm"
          key={job.id}
        >
          {/* An article, not a section: a named section is a landmark, and a
              page of up to 50 cards would flood the landmark list. */}
          <article aria-labelledby={`application-${job.id}`} className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3
                  className="break-words font-semibold text-app-text"
                  id={`application-${job.id}`}
                >
                  {job.company}
                </h3>
                <p className="break-words text-sm text-app-textMuted">{job.roleTitle}</p>
              </div>
              <StatusPill status={job.status} />
            </div>
            <ul
              aria-label={t('applications.documentsFor', { company: job.company })}
              className="mt-3 flex-1 space-y-3 border-t border-app-borderSoft pt-3"
            >
              {documents.map((document) => (
                <li key={document.id}>
                  <ApplicationDocumentItem document={document} showType />
                </li>
              ))}
            </ul>
            <div className="mt-4 self-end">
              <JobDetailAction
                company={job.company}
                detailPath={APP_PATH_BUILDERS.jobDetail(job.id)}
              />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
};
