import { useCallback, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, ErrorState, LoadingState } from '../../components/ui';
import { JobDetailHeader, JobDetailTabs } from '../../features/jobDetail';
import { ArrowLeftIcon } from '../../components/icons';
import { isJobNotFoundError, useDeleteJob } from '../../features/jobs';
import { useTranslation } from '../../i18n';
import { AppError } from '../../errors';
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
 * The route owns the load and this page owns the delete, which is the one
 * write it renders a control for. The status select is still disabled and
 * the tasks, notes and timeline tabs are still read-only: those have no
 * backend behind them until tasks 030 to 032, and the page offers no
 * control it cannot complete.
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
  const { deleteJob, error: deleteError, isDeleting } = useDeleteJob();

  /**
   * Leaves for the jobs list only once the job is gone from the server, so a
   * failed delete keeps the user on the job it failed for. The list refetches
   * on mount, so arriving there shows it without the row.
   *
   * Two deletes of one job are not two of the same answer: the first removes
   * the row and the second answers 404. What stops the second is the button
   * disabling, measured: with `isDeletingJob` removed, two clicks with no
   * await between them send two requests. This needs no in-flight ref, unlike
   * the create form, because that one awaited form validation before reaching
   * its mutation, so the disable landed a render too late. Here the mutation
   * is called from the click handler itself and the disable is already in the
   * DOM before a second click can be dispatched.
   *
   * A 404 goes to the list too. The job is already absent, which is what the
   * user asked for, and reporting a failure would offer a retry that cannot
   * change the answer. That also covers the second tab this page cannot see.
   */
  const handleDeleteJob = useCallback(
    async (jobId: string) => {
      try {
        await deleteJob(jobId);
        navigate(APP_PATHS.JOBS);
      } catch (caught) {
        if (!(caught instanceof AppError)) throw caught;

        if (isJobNotFoundError(caught)) navigate(APP_PATHS.JOBS);
      }
    },
    [deleteJob, navigate],
  );

  /**
   * A 404 records an error before the handler navigates away. Deciding here
   * rather than on `deleteError` alone keeps a flash of the wrong message out
   * of whichever order React commits the two updates in.
   */
  const hasDeleteFailure = deleteError !== null && !isJobNotFoundError(deleteError);

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
      {hasDeleteFailure && (
        <ErrorState description={deleteError.message} title={t('jobDetail.deleteErrorTitle')} />
      )}

      <div className="space-y-3">
        <Button
          leftIcon={<ArrowLeftIcon />}
          onClick={() => navigate(APP_PATHS.JOBS)}
          size="sm"
          variant="ghost"
        >
          {t('jobDetail.backToJobs')}
        </Button>

        <JobDetailHeader
          isDeletingJob={isDeleting}
          job={job}
          onDeleteJob={() => handleDeleteJob(job.id)}
          onEditJob={() => navigate(APP_PATH_BUILDERS.jobEdit(job.id))}
        />
      </div>

      <JobDetailTabs job={job} />
    </div>
  );
};
