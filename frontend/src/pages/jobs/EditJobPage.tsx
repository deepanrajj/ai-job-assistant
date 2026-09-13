import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, ErrorState, LoadingState } from '../../components/ui';
import { EditJobForm } from './EditJobForm';
import { useTranslation } from '../../i18n';
import type { AppError } from '../../errors';
import { APP_PATHS } from '../../routes/paths';
import type { TJob } from '../../types';

/**
 * Props used by the edit job page.
 */
interface IEditJobPageProps {
  error: AppError | null;
  isLoading: boolean;
  isNotFound: boolean;
  job: TJob | null;
  onRetry: () => void;
}

/**
 * Renders the edit workflow for one job loaded from the backend.
 *
 * The page chooses the state and `EditJobForm` owns the form, which is what
 * keeps the form's default values and the loaded job the same thing.
 *
 * @param {IEditJobPageProps} props Component props.
 * @returns {JSX.Element} Edit job page.
 */
export const EditJobPage: FC<IEditJobPageProps> = ({
  error,
  isLoading,
  isNotFound,
  job,
  onRetry,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) return <LoadingState label={t('jobDetail.loading')} />;

  // Checked before `error`, which a missing job also sets. Asking again for
  // a job that does not exist cannot answer differently.
  if (isNotFound)
    return (
      <ErrorState
        action={
          <Button onClick={() => navigate(APP_PATHS.JOBS)}>{t('jobDetail.backToJobs')}</Button>
        }
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

  return <EditJobForm job={job} />;
};
