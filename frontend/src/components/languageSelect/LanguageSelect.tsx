import type { FC } from 'react';

import { supportedLanguages, useTranslation } from '../../i18n';

/**
 * Renders a compact language switch bound to the translation context.
 *
 * @returns {JSX.Element} Language select control.
 */
export const LanguageSelect: FC = () => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div
      aria-label={t('app.language.label')}
      className="inline-flex rounded-full border border-app-border bg-app-surface2 p-1"
      role="group"
    >
      {supportedLanguages.map((option) => (
        <button
          // The visible code starts the name so voice control users can say "click DE".
          aria-label={`${option.toUpperCase()} ${t(`app.language.${option}`)}`}
          aria-pressed={language === option}
          className={`min-h-8 min-w-9 rounded-full px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 ${
            language === option
              ? 'bg-primary-100 text-primary-900'
              : 'text-app-textSoft hover:bg-primary-50 hover:text-primary-800'
          }`}
          key={option}
          onClick={() => setLanguage(option)}
          type="button"
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
