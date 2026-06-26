import { useCallback, useMemo, type FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

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
 * Props used by the new job page.
 */
interface INewJobPageProps {
  onSave?: (job: TJob) => void;
}

/**
 * Renders the frontend-only add job workflow.
 *
 * @param {INewJobPageProps} props Component props.
 * @returns {JSX.Element} New job page.
 */
export const NewJobPage: FC<INewJobPageProps> = ({ onSave }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  const handleSubmit: SubmitHandler<TJobFormValues> = useCallback(
    (values) => {
      onSave?.(createJobFormPayload(values));
      navigate(APP_PATHS.JOBS);
    },
    [navigate, onSave],
  );

  return (
    <JobForm
      form={form}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      submitLabel={t('jobForm.actions.create')}
      subtitle={t('jobForm.createSubtitle')}
      title={t('jobForm.createTitle')}
    />
  );
};
