import { useCallback, useMemo, type FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { ErrorState } from '../../components/ui';
import { JobForm } from '../../features/jobs/components/JobForm';
import { createJobFormSchema, type TJobFormValues } from '../../features/jobs/jobFormSchema';
import { useUpdateJob } from '../../features/jobs';
import { useTranslation } from '../../i18n';
import { createJobFormDefaultValues, createJobFormFields } from '../../features/jobs/jobForm.utils';
import { AppError } from '../../errors';
import { APP_PATHS } from '../../routes/paths';
import type { TJob } from '../../types';

/**
 * Props used by the edit job form.
 */
interface IEditJobFormProps {
  job: TJob;
}

/**
 * Renders the edit form for a job that has already loaded.
 *
 * Split from `EditJobPage` because React Hook Form reads `defaultValues`
 * when the form mounts and never again, verified with a throwaway probe: a
 * rerender with different defaults kept the first set. Mounting this only
 * once the job exists is what makes the prefilled values the job's values,
 * without an effect that resets the form and could wipe what the user is
 * typing.
 *
 * @param {IEditJobFormProps} props Component props.
 * @returns {JSX.Element} Edit job form.
 */
export const EditJobForm: FC<IEditJobFormProps> = ({ job }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { error, isSaving, saveJob } = useUpdateJob();
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

  /**
   * Navigates only once the update is stored, so a failed save leaves every
   * entered value in place.
   *
   * The `catch` is required rather than defensive, and narrow on purpose,
   * as in `NewJobPage`: `saveJob` rejects with an `AppError` after the error
   * is already recorded in request state, and `handleSubmit` rethrows
   * whatever this handler rejects with, which would surface as an unhandled
   * rejection while the error renders correctly anyway. Any other throw is a
   * defect and is rethrown rather than hidden.
   *
   * Unlike the create form this needs no in-flight ref. `PUT /api/jobs/{id}`
   * addresses one job and replaces every editable field, so a second click
   * sending the same body leaves exactly the state the first one did.
   */
  const handleSubmit: SubmitHandler<TJobFormValues> = useCallback(
    async (values) => {
      try {
        await saveJob({
          fields: createJobFormFields(values),
          jobId: job.id,
        });
        navigate(APP_PATHS.JOBS);
      } catch (caught) {
        if (!(caught instanceof AppError)) throw caught;
      }
    },
    [job.id, navigate, saveJob],
  );

  return (
    <JobForm
      error={
        error && <ErrorState description={error.message} title={t('jobForm.updateErrorTitle')} />
      }
      form={form}
      isSubmitting={isSaving}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      submitLabel={t('jobForm.actions.save')}
      subtitle={t('jobForm.editSubtitle')}
      title={t('jobForm.editTitle')}
    />
  );
};
