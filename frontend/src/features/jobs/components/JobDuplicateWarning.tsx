import { useMemo, type FC } from 'react';
import { useWatch, type Control } from 'react-hook-form';

import { Alert } from '../../../components/ui';
import type { IJobsListState } from '../useJobsList';
import { useTranslation } from '../../../i18n';
import { findDuplicates } from '../../duplicates/duplicates.utils';
import { APP_PATH_BUILDERS } from '../../../routes/paths';
import { DUPLICATE_REASON_TRANSLATION_KEYS } from '../../duplicates/duplicates.constants';
import type { TJob } from '../../../types';
import type { TJobFormValues } from '../jobFormSchema';

/**
 * Props used by the job form's duplicate warning.
 */
interface IJobDuplicateWarningProps {
  control: Control<TJobFormValues>;
  excludeJobId?: TJob['id'];
  jobs: Pick<IJobsListState, 'error' | 'isLoading' | 'jobs'>;
}

/**
 * Warns, while a job is added or edited, that similar jobs are already
 * saved, with the same rules as the import review (task 048). It never
 * blocks saving.
 *
 * Says nothing while the saved jobs load or when they cannot load: the
 * check is advice, and an error about it would read as a problem with
 * saving. The job being edited is left out, or it would match itself.
 *
 * The live region stays mounted so a screen reader announces a match when
 * it appears; the matches open in a new tab so the form keeps its values.
 *
 * @param {IJobDuplicateWarningProps} props Component props.
 * @returns {JSX.Element} Live region holding the warning, if any.
 */
export const JobDuplicateWarning: FC<IJobDuplicateWarningProps> = ({
  control,
  excludeJobId,
  jobs: { error, isLoading, jobs },
}) => {
  const { t } = useTranslation();
  const [company, roleTitle, location, jobUrl] = useWatch({
    control,
    name: ['company', 'roleTitle', 'location', 'jobUrl'],
  });
  const matches = useMemo(
    () =>
      isLoading || error
        ? []
        : findDuplicates(
            { company, location, roleTitle, url: jobUrl },
            jobs.filter((job) => job.id !== excludeJobId),
          ),
    [company, error, excludeJobId, isLoading, jobUrl, jobs, location, roleTitle],
  );

  return (
    <div aria-live="polite">
      {matches.length > 0 && (
        <Alert role="status" variant="warning">
          <p className="font-medium">{t('jobForm.duplicates.title')}</p>
          <ul className="mt-2 space-y-1">
            {matches.map(({ classification, job, reason }) =>
              job && reason ? (
                <li key={job.id}>
                  <a
                    className="font-medium underline"
                    href={APP_PATH_BUILDERS.jobDetail(job.id)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t('jobForm.duplicates.jobLabel', {
                      company: job.company,
                      roleTitle: job.roleTitle,
                    })}
                    <span className="sr-only"> {t('jobForm.duplicates.opensInNewTab')}</span>
                  </a>{' '}
                  {t(
                    classification === 'LIKELY_DUPLICATE'
                      ? 'jobForm.duplicates.likely'
                      : 'jobForm.duplicates.possible',
                    { reason: t(DUPLICATE_REASON_TRANSLATION_KEYS[reason]) },
                  )}
                </li>
              ) : null,
            )}
          </ul>
          <p className="mt-2">{t('jobForm.duplicates.canStillSave')}</p>
        </Alert>
      )}
    </div>
  );
};
