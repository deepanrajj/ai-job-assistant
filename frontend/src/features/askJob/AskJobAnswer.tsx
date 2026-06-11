import { memo, type FC } from 'react';

import { useTranslation } from '../../i18n';

/**
 * Props used by the AI answer panel.
 */
interface IAskJobAnswerProps {
  answer: string;
}

/**
 * Renders the AI answer returned for a follow-up job question.
 *
 * @param {IAskJobAnswerProps} props Component props.
 * @param {string} props.answer AI-generated answer text.
 * @returns {JSX.Element} Answer panel.
 */
const AskJobAnswerComponent: FC<IAskJobAnswerProps> = ({ answer }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-app-border bg-app-surface2 p-4" role="status">
      <p className="mb-2 text-sm font-semibold uppercase text-primary-700">{t('ai.answer')}</p>
      <p className="text-sm leading-7 text-app-textSoft">{answer}</p>
    </div>
  );
};

export const AskJobAnswer = memo(AskJobAnswerComponent);
