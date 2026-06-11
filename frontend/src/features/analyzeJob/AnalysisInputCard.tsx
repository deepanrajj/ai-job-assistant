import type { FC } from 'react';
import type { SubmitHandler, UseFormReturn } from 'react-hook-form';

import { Alert, Button, Card } from '../../components/ui';
import { Form, FormFields, type TFormFieldConfig } from '../../components/form';
import { useTranslation } from '../../i18n';
import type { TAnalyzeJobFormValues } from './analyzeJobFormSchema';

/**
 * Props used by the job description input card.
 */
interface IAnalysisInputCardProps {
  error: string;
  form: UseFormReturn<TAnalyzeJobFormValues>;
  isLoading: boolean;
  onAnalyze: SubmitHandler<TAnalyzeJobFormValues>;
}

/**
 * Renders the job description form used to start an AI analysis.
 *
 * @param {IAnalysisInputCardProps} props Component props.
 * @param {string} props.error Display-ready analysis error message.
 * @param {UseFormReturn<TAnalyzeJobFormValues>} props.form React Hook Form instance.
 * @param {boolean} props.isLoading Whether an analysis request is in progress.
 * @param {SubmitHandler<TAnalyzeJobFormValues>} props.onAnalyze Submit handler for the form.
 * @returns {JSX.Element} Job description input card.
 */
export const AnalysisInputCard: FC<IAnalysisInputCardProps> = ({
  error,
  form,
  isLoading,
  onAnalyze,
}) => {
  const { t } = useTranslation();
  const fields: TFormFieldConfig<TAnalyzeJobFormValues>[] = [
    {
      ariaLabel: t('a11y.jobDescriptionInput'),
      className: 'min-h-[320px] bg-app-surface2',
      name: 'description',
      placeholder: t('ai.inputPlaceholder'),
      type: 'textarea',
    },
  ];

  return (
    <Card title={t('ai.inputTitle')}>
      <Form form={form} onSubmit={onAnalyze}>
        <FormFields<TAnalyzeJobFormValues> fields={fields} />

        <Button
          aria-busy={isLoading}
          disabled={isLoading}
          className="mt-4"
          fullWidth
          size="lg"
          type="submit"
        >
          {isLoading ? t('ai.analyzing') : t('ai.analyzeButton')}
        </Button>
      </Form>

      {error && <Alert className="mt-4">{error}</Alert>}
    </Card>
  );
};
