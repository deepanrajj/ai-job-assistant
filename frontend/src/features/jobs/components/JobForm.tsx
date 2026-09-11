import type { FC, ReactNode } from 'react';
import type { SubmitHandler, UseFormReturn } from 'react-hook-form';

import { Form, FormFields, type TFormFieldConfig } from '../../../components/form';
import { Button, Card } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import { jobStatusOptions } from '../jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS } from '../../../types';
import type { TJobFormValues } from '../jobFormSchema';

/**
 * Props used by the add/edit job form.
 */
interface IJobFormProps {
  error?: ReactNode;
  form: UseFormReturn<TJobFormValues>;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: SubmitHandler<TJobFormValues>;
  submitLabel: string;
  subtitle: string;
  title: string;
}

/**
 * Renders the shared add/edit job form.
 *
 * @param {IJobFormProps} props Component props.
 * @returns {JSX.Element} Job form card.
 */
export const JobForm: FC<IJobFormProps> = ({
  error,
  form,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
  subtitle,
  title,
}) => {
  const { t } = useTranslation();
  const fields: TFormFieldConfig<TJobFormValues>[] = [
    {
      name: 'company',
      label: t('jobForm.fields.company'),
      placeholder: t('jobForm.placeholders.company'),
      type: 'input',
    },
    {
      name: 'roleTitle',
      label: t('jobForm.fields.roleTitle'),
      placeholder: t('jobForm.placeholders.roleTitle'),
      type: 'input',
    },
    {
      name: 'status',
      label: t('jobForm.fields.status'),
      options: jobStatusOptions.map((status) => ({
        label: t(JOB_STATUS_TRANSLATION_KEYS[status]),
        value: status,
      })),
      type: 'select',
    },
    {
      name: 'location',
      label: t('jobForm.fields.location'),
      placeholder: t('jobForm.placeholders.location'),
      type: 'input',
    },
    {
      containerClassName: 'md:col-span-2',
      name: 'jobUrl',
      label: t('jobForm.fields.jobUrl'),
      placeholder: t('jobForm.placeholders.jobUrl'),
      type: 'input',
    },
    {
      inputType: 'number',
      name: 'salaryMin',
      label: t('jobForm.fields.salaryMin'),
      placeholder: t('jobForm.placeholders.salaryMin'),
      type: 'input',
    },
    {
      inputType: 'number',
      name: 'salaryMax',
      label: t('jobForm.fields.salaryMax'),
      placeholder: t('jobForm.placeholders.salaryMax'),
      type: 'input',
    },
    {
      className: 'min-h-36',
      containerClassName: 'md:col-span-2',
      name: 'description',
      label: t('jobForm.fields.description'),
      placeholder: t('jobForm.placeholders.description'),
      rows: 6,
      type: 'textarea',
    },
  ];

  return (
    <Card subtitle={subtitle} title={title}>
      <Form className="space-y-6" form={form} onSubmit={onSubmit}>
        {error}

        <FormFields<TJobFormValues> columns={2} fields={fields} />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onCancel} type="button" variant="secondary">
            {t('jobForm.cancel')}
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {submitLabel}
          </Button>
        </div>
      </Form>
    </Card>
  );
};
