import { useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { JobDetailHeader, JobDetailTabs } from '../../features/jobDetail';
import { Button, ErrorState } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { APP_PATHS } from '../../routes/paths';
import type { TJobDetail } from '../../types';

/**
 * Props used by the job detail page.
 */
interface IJobDetailPageProps {
  jobId: string;
  jobs: TJobDetail[];
}

/**
 * Renders the saved job detail workflow using mock detail data.
 *
 * @param {IJobDetailPageProps} props Component props.
 * @returns {JSX.Element} Job detail page.
 */
export const JobDetailPage: FC<IJobDetailPageProps> = ({ jobId, jobs }) => {
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

  return (
    <div className="space-y-6">
      <Button onClick={() => navigate(APP_PATHS.JOBS)} size="sm" variant="secondary">
        {t('jobDetail.backToJobs')}
      </Button>

      <JobDetailHeader job={job} />
      <JobDetailTabs job={job} />
    </div>
  );
};
