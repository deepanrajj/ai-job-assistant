import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, ErrorState, LoadingState } from '../../components/ui';
import { JobDetailHeader, JobDetailTabs } from '../../features/jobDetail';
import { ArrowLeftIcon } from '../../components/icons';
import { useTranslation } from '../../i18n';
import type { AppError } from '../../errors';
import { APP_PATH_BUILDERS, APP_PATHS } from '../../routes/paths';
import type { TJobDetail } from '../../types';

/**
 * Props used by the job detail page.
 */
interface IJobDetailPageProps {
  error: AppError | null;
  isLoading: boolean;
  isNotFound: boolean;
  job: TJobDetail | null;
  onRetry: () => void;
}

/**
 * Renders one saved job loaded from the backend.
 *
 * The page holds no write of its own. Every one it used to offer went to
 * the localStorage store keyed by job id, which matches nothing for a job
 * that came from the API, so each would look like it worked and do nothing.
 * Status and delete arrive with task 028, and the tasks, notes and timeline
 * tabs with tasks 030 to 032; until then the page offers no control it
 * cannot complete. Editing is not one of those: task 027 put the edit form
 * on the backend, so the header's edit action leads somewhere again.
 *
 * @param {IJobDetailPageProps} props Component props.
 * @returns {JSX.Element} Job detail page.
 */
export const JobDetailPage: FC<IJobDetailPageProps> = ({
  error,
  isLoading,
  isNotFound,
  job,
  onRetry,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const backToJobsButton = (
    <Button onClick={() => navigate(APP_PATHS.JOBS)}>{t('jobDetail.backToJobs')}</Button>
  );

  if (isLoading) return <LoadingState label={t('jobDetail.loading')} />;

  // Checked before `error`, which a missing job also sets. Nothing about a
  // job that does not exist improves by asking for it again, so this state
  // offers the way back rather than a retry.
  if (isNotFound)
    return (
      <ErrorState
        action={backToJobsButton}
        description={t('jobDetail.notFoundDescription')}
        title={t('jobDetail.notFoundTitle')}
      />
    );

  if (error || !job)
    return (
      <ErrorState
        action={<Button onClick={onRetry}>{t('jobs.loadErrorRetry')}</Button>}
        description={error?.message}
        title={t('jobDetail.loadErrorTitle')}
      />
    );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button
          leftIcon={<ArrowLeftIcon />}
          onClick={() => navigate(APP_PATHS.JOBS)}
          size="sm"
          variant="ghost"
        >
          {t('jobDetail.backToJobs')}
        </Button>

        <JobDetailHeader job={job} onEditJob={() => navigate(APP_PATH_BUILDERS.jobEdit(job.id))} />
      </div>

      <JobDetailTabs job={job} />
    </div>
  );
};
