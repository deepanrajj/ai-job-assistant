import { useCallback, useMemo, type FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { ErrorState } from '../../components/ui';
import { JobForm } from '../../features/jobs/components/JobForm';
import { createJobFormSchema, type TJobFormValues } from '../../features/jobs/jobFormSchema';
import { useCreateJob } from '../../features/jobs';
import { useTranslation } from '../../i18n';
import { createJobFormDefaultValues, createJobFormFields } from '../../features/jobs/jobForm.utils';
import { APP_PATHS } from '../../routes/paths';

/**
 * Renders the add job workflow, creating the job through the backend.
 *
 * @returns {JSX.Element} New job page.
 */
export const NewJobPage: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { error, isSaving, saveJob } = useCreateJob();
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
    defaultValues: createJobFormDefaultValues(),
    resolver: zodResolver(schema),
  });

  const handleCancel = useCallback(() => {
    navigate(APP_PATHS.JOBS);
  }, [navigate]);

  /**
   * Navigates only once the job exists on the server, so a failed create
   * leaves every entered value in place.
   *
   * The `catch` is required rather than defensive. `saveJob` rejects after
   * the error is already recorded in request state, and `handleSubmit`
   * rethrows whatever this handler rejects with, which would surface as an
   * unhandled rejection while the error renders correctly anyway.
   *
   * Success goes to the jobs list rather than the new job's detail page,
   * which still resolves ids against localStorage and would answer
   * "Job not found" for a server-assigned id until task 029.
   */
  const handleSubmit: SubmitHandler<TJobFormValues> = useCallback(
    async (values) => {
      try {
        await saveJob(createJobFormFields(values));
        navigate(APP_PATHS.JOBS);
      } catch {
        // Error is already recorded in request state and rendered from it.
      }
    },
    [navigate, saveJob],
  );

  return (
    <JobForm
      error={
        error && <ErrorState description={error.message} title={t('jobForm.createErrorTitle')} />
      }
      form={form}
      isSubmitting={isSaving}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      submitLabel={t('jobForm.actions.create')}
      subtitle={t('jobForm.createSubtitle')}
      title={t('jobForm.createTitle')}
    />
  );
};
