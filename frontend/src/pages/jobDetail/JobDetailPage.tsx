import { useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, ErrorState } from '../../components/ui';
import { JobDetailHeader, JobDetailTabs } from '../../features/jobDetail';
import { ArrowLeftIcon } from '../../components/icons';
import { useTranslation } from '../../i18n';
import { APP_PATH_BUILDERS, APP_PATHS } from '../../routes/paths';
import type { TJobDetail } from '../../types';
import type { IJobDetailPageActions } from '../../features/jobDetail/jobDetail.types';

/**
 * Props used by the job detail page.
 */
interface IJobDetailPageProps extends IJobDetailPageActions {
  jobId: string;
  jobs: TJobDetail[];
}

/**
 * Renders the saved local job detail workflow.
 *
 * @param {IJobDetailPageProps} props Component props.
 * @returns {JSX.Element} Job detail page.
 */
export const JobDetailPage: FC<IJobDetailPageProps> = ({
  jobId,
  jobs,
  onAnalyzeJob,
  onCreateNote,
  onCreateTask,
  onDeleteJob,
  onDeleteNote,
  onDeleteTask,
  onStatusChange,
  onUpdateNote,
  onUpdateTask,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const job = useMemo(() => jobs.find((savedJob) => savedJob.id === jobId), [jobId, jobs]);

  if (!job) {
    return (
      <ErrorState
        action={
          <Button onClick={() => navigate(APP_PATHS.JOBS)}>{t('jobDetail.backToJobs')}</Button>
        }
        description={t('jobDetail.notFoundDescription')}
        title={t('jobDetail.notFoundTitle')}
      />
    );
  }

  const handleDeleteJob = () => {
    onDeleteJob?.(job.id);
    navigate(APP_PATHS.JOBS);
  };

  const handleEditJob = () => {
    navigate(APP_PATH_BUILDERS.jobEdit(job.id));
  };

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

        <JobDetailHeader
          job={job}
          onDeleteJob={handleDeleteJob}
          onEditJob={handleEditJob}
          onStatusChange={(status) => onStatusChange?.(job.id, status)}
        />
      </div>

      <JobDetailTabs
        job={job}
        onAnalyzeJob={onAnalyzeJob}
        onCreateNote={onCreateNote}
        onCreateTask={onCreateTask}
        onDeleteNote={onDeleteNote}
        onDeleteTask={onDeleteTask}
        onUpdateNote={onUpdateNote}
        onUpdateTask={onUpdateTask}
      />
    </div>
  );
};
