import type { ChangeEventHandler, FC } from 'react';

import { LanguageIcon } from '../icons';
import { isLanguage, supportedLanguages, useTranslation } from '../../i18n';

/**
 * Renders the language selector bound to the translation context.
 *
 * @returns {JSX.Element} Language select control.
 */
export const LanguageSelect: FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const handleLanguageChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    if (isLanguage(event.target.value)) setLanguage(event.target.value);
  };

  return (
    <label className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface2 px-3 py-2 text-sm text-app-textSoft">
      <span className="sr-only">{t('app.language.label')}</span>
      <LanguageIcon />
      <select
        className="rounded bg-transparent text-sm font-medium text-app-text outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface2"
        onChange={handleLanguageChange}
        value={language}
      >
        {supportedLanguages.map((option) => (
          <option key={option} value={option}>
            {t(`app.language.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
};
