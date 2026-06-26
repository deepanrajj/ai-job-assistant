import { useCallback, useMemo, type FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button, ErrorState } from '../../components/ui';
import { JobForm } from '../../features/jobs/components/JobForm';
import { createJobFormSchema, type TJobFormValues } from '../../features/jobs/jobFormSchema';
import { useTranslation } from '../../i18n';
import {
  createJobFormDefaultValues,
  createJobFormPayload,
} from '../../features/jobs/jobForm.utils';
import { APP_PATHS } from '../../routes/paths';
import type { TJob } from '../../types';

/**
 * Props used by the edit job page.
 */
interface IEditJobPageProps {
  jobId: string;
  jobs: TJob[];
  onSave?: (job: TJob) => void;
}

/**
 * Renders the frontend-only edit job workflow.
 *
 * @param {IEditJobPageProps} props Component props.
 * @returns {JSX.Element} Edit job page.
 */
export const EditJobPage: FC<IEditJobPageProps> = ({ jobId, jobs, onSave }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const job = useMemo(() => jobs.find((savedJob) => savedJob.id === jobId), [jobId, jobs]);
  const schema = useMemo(
    () =>
      createJobFormSchema({
        invalidSalary: t('jobForm.validation.invalidSalary'),
        invalidSalaryRange: t('jobForm.validation.invalidSalaryRange'),
        invalidUrl: t('jobForm.validation.invalidUrl'),
        requiredCompany: t('jobForm.validation.requiredCompany'),
        requiredRole: t('jobForm.validation.requiredRole'),
      }),
    [t],
  );
  const form = useForm<TJobFormValues>({
    defaultValues: createJobFormDefaultValues(job),
    resolver: zodResolver(schema),
  });

  const handleCancel = useCallback(() => {
    navigate(APP_PATHS.JOBS);
  }, [navigate]);

  const handleSubmit: SubmitHandler<TJobFormValues> = useCallback(
    (values) => {
      onSave?.(createJobFormPayload(values, job));
      navigate(APP_PATHS.JOBS);
    },
    [job, navigate, onSave],
  );

  if (!job) {
    return (
      <ErrorState
        action={<Button onClick={handleCancel}>{t('jobDetail.backToJobs')}</Button>}
        description={t('jobDetail.notFoundDescription')}
        title={t('jobDetail.notFoundTitle')}
      />
    );
  }

  return (
    <JobForm
      form={form}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      submitLabel={t('jobForm.actions.save')}
      subtitle={t('jobForm.editSubtitle')}
      title={t('jobForm.editTitle')}
    />
  );
};
