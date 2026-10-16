import type { FC } from 'react';

import { JobDetailAction } from '../../jobs/components/JobDetailAction';
import { ApplicationDocumentItem } from './ApplicationDocumentItem';
import { useTranslation } from '../../../i18n';
import { APP_PATH_BUILDERS } from '../../../routes/paths';
import { DOCUMENT_TYPE_TRANSLATION_KEYS, type TJobDocumentType } from '../../../types';
import type { IApplicationGroup } from '../applications.types';

/**
 * Props used by the materials matrix.
 */
interface IApplicationsMatrixProps {
  /**
   * Type columns, from every job rather than this page's, so the columns
   * stay put while paging, searching, or filtering.
   */
  columns: TJobDocumentType[];
  groups: IApplicationGroup[];
}

/**
 * Shows which material went to which application: a table with one row
 * per job and one column per document type in use across all jobs. A
 * cell lists that job's documents of that type, or a dash with "None"
 * for screen readers. The row header holds only the company and role, as
 * screen readers repeat it for every cell; the "Open job" button has
 * its own last column. One of the two Applications layouts from `xl` up;
 * narrower screens always get the job cards. The table has its own name,
 * distinct from the card's heading, so screen readers do not hear
 * "Application materials" twice.
 *
 * @param {IApplicationsMatrixProps} props Component props.
 * @returns {JSX.Element} Materials matrix.
 */
export const ApplicationsMatrix: FC<IApplicationsMatrixProps> = ({ columns, groups }) => {
  const { t } = useTranslation();

  return (
    <table
      aria-label={t('applications.matrix.label')}
      className="w-full table-fixed text-left text-sm"
    >
      <thead className="bg-app-surface2/60 text-xs font-semibold uppercase tracking-wide text-app-textMuted">
        <tr>
          <th className="w-1/4 px-5 py-3" scope="col">
            {t('applications.matrix.job')}
          </th>
          {columns.map((type) => (
            <th className="px-4 py-3" key={type} scope="col">
              {t(DOCUMENT_TYPE_TRANSLATION_KEYS[type])}
            </th>
          ))}
          <th className="w-16 px-5 py-3 2xl:w-44" scope="col">
            <span className="sr-only">{t('applications.matrix.actions')}</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-app-borderSoft">
        {groups.map(({ documents, job }) => (
          <tr className="align-top" key={job.id}>
            <th className="px-5 py-4 font-normal" scope="row">
              <span className="block break-words font-semibold text-app-text">{job.company}</span>
              <span className="block break-words text-app-textMuted">{job.roleTitle}</span>
            </th>
            {columns.map((type) => {
              const ofType = documents.filter((document) => document.type === type);

              return (
                <td className="px-4 py-4" key={type}>
                  {ofType.length === 0 ? (
                    <>
                      <span aria-hidden="true" className="text-app-textMuted">
                        —
                      </span>
                      <span className="sr-only">{t('applications.matrix.none')}</span>
                    </>
                  ) : (
                    <div className="space-y-3">
                      {ofType.map((document) => (
                        <ApplicationDocumentItem document={document} key={document.id} />
                      ))}
                    </div>
                  )}
                </td>
              );
            })}
            <td className="px-5 py-4 text-right">
              {/* Below 2xl the type columns need the width, so only the icon shows. */}
              <JobDetailAction
                company={job.company}
                detailPath={APP_PATH_BUILDERS.jobDetail(job.id)}
                labelClassName="hidden 2xl:inline"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
