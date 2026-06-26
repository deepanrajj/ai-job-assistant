import { useMemo, type FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';

import {
  AnalysisInputCard,
  AnalysisPanel,
  createAnalyzeJobFormSchema,
  type TAnalyzeJobFormValues,
} from '../../features/analyzeJob';
import { analyzeJobDescription } from '../../services';
import { useAsyncMutation } from '../../hooks';
import { useTranslation } from '../../i18n';

/**
 * Renders the job description analyzer workflow and displays AI analysis results.
 *
 * @returns {JSX.Element} TJob analysis input and result panels.
 */
export const AnalyzeJobPage: FC = () => {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      createAnalyzeJobFormSchema({
        emptyDescription: t('ai.emptyDescriptionError'),
      }),
    [t],
  );
  const form = useForm<TAnalyzeJobFormValues>({
    defaultValues: {
      description: '',
    },
    resolver: zodResolver(schema),
  });
  const { control } = form;
  const description = useWatch({
    control,
    name: 'description',
  });
  const {
    mutate: analyzeJob,
    request: { data, error, status, isLoading },
  } = useAsyncMutation(analyzeJobDescription);

  const handleAnalyze: SubmitHandler<TAnalyzeJobFormValues> = async ({ description }) => {
    const trimmedDescription = description.trim();

    try {
      await analyzeJob({
        description: trimmedDescription,
      });
    } catch {
      // Error alert is rendered from useAsyncMutation request state.
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.15fr_0.85fr]">
      <AnalysisInputCard
        error={error?.message ?? ''}
        form={form}
        isLoading={isLoading}
        onAnalyze={handleAnalyze}
      />

      <AnalysisPanel analysis={data} description={description} status={status} />
    </div>
  );
};
