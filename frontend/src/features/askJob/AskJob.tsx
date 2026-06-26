import { useMemo, type FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';

import { Form, FormFields, type TFormFieldConfig } from '../../components/form';
import { Alert, Button } from '../../components/ui';
import { AskJobAnswer } from './AskJobAnswer';
import { AskJobAnswerSkeleton } from './AskJobAnswerSkeleton';
import { askJobQuestion } from '../../services';
import { useAsyncMutation } from '../../hooks';
import { useTranslation } from '../../i18n';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import { createAskJobFormSchema, type TAskJobFormValues } from './askJobFormSchema';

/**
 * Props used by the AI follow-up question feature.
 */
interface IAskJobProps {
  description: string;
}

/**
 * Renders an AI question box for asking follow-up questions about a job description.
 *
 * @param {IAskJobProps} props Component props.
 * @param {string} props.description Job description context sent with each question.
 * @returns {JSX.Element} Question input, loading state, error state, and AI answer panel.
 */
export const AskJob: FC<IAskJobProps> = ({ description }) => {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      createAskJobFormSchema({
        emptyQuestion: t('ai.enterQuestionError'),
      }),
    [t],
  );
  const form = useForm<TAskJobFormValues>({
    defaultValues: {
      question: '',
    },
    resolver: zodResolver(schema),
  });
  const { control } = form;
  const question = useWatch({
    control,
    name: 'question',
  });
  const { mutate: askJob, request: askJobRequest } = useAsyncMutation(askJobQuestion);
  const fields: TFormFieldConfig<TAskJobFormValues>[] = [
    {
      ariaLabel: t('a11y.askQuestionInput'),
      className: 'bg-app-surface2',
      containerClassName: 'flex-1',
      name: 'question',
      placeholder: t('ai.askPlaceholder'),
      type: 'input',
    },
  ];

  const handleAsk: SubmitHandler<TAskJobFormValues> = async ({ question }) => {
    const trimmedDescription = description.trim();
    const trimmedQuestion = question.trim();

    if (!trimmedDescription) {
      askJobRequest.setError(
        new AppError(t('ai.emptyDescriptionError'), APP_ERROR_CODES.EMPTY_DESCRIPTION),
      );
      return;
    }

    try {
      await askJob({
        description: trimmedDescription,
        question: trimmedQuestion,
      });
    } catch {
      // Error alert is rendered from useAsyncMutation request state.
    }
  };

  return (
    <div className="space-y-4">
      <Form className="flex gap-2" form={form} onSubmit={handleAsk}>
        <FormFields<TAskJobFormValues> className="flex-1" fields={fields} />
        <Button
          aria-busy={askJobRequest.isLoading}
          disabled={askJobRequest.isLoading || !question.trim()}
          type="submit"
        >
          {askJobRequest.isLoading ? t('ai.asking') : t('ai.askButton')}
        </Button>
      </Form>

      {askJobRequest.error && <Alert>{askJobRequest.error.message}</Alert>}

      {askJobRequest.isLoading && <AskJobAnswerSkeleton label={t('ai.asking')} />}

      {askJobRequest.data && !askJobRequest.isLoading && (
        <AskJobAnswer answer={askJobRequest.data.answer} />
      )}
    </div>
  );
};
