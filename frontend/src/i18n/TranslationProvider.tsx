import { useEffect, useMemo, useState, type FC, type ReactNode } from 'react';

import { TranslationContext } from './TranslationContext';
import { getInitialLanguage, translate } from './utils/translation';
import { LANGUAGE_STORAGE_KEY } from './constants';
import type { TLanguage, TTranslationContextValue } from './i18n.types';

/**
 * Props for the translation provider wrapper.
 */
interface ITranslationProviderProps {
  children: ReactNode;
}

/**
 * Provides the active language, language setter, and translation lookup function to the app.
 *
 * @param props Component props.
 * @param props.children React tree that should receive translation context.
 * @returns {JSX.Element} Translation context provider with persisted language state.
 */
export const TranslationProvider: FC<ITranslationProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<TLanguage>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<TTranslationContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params) => translate(key, params, language),
    }),
    [language],
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};
