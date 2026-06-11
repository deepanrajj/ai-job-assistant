import { useContext } from 'react';

import { TranslationContext } from './TranslationContext';
import { AppError } from '../errors';
import { APP_ERROR_CODES } from '../types';

/**
 * Reads the i18n context for components that need translated copy or language controls.
 *
 * @returns {TTranslationContextValue} Translation context value with language, setter, and t() helper.
 * @throws {AppError} When used outside TranslationProvider.
 */
export const useTranslation = () => {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new AppError(
      'useTranslation must be used inside TranslationProvider',
      APP_ERROR_CODES.TRANSLATION_PROVIDER_MISSING,
    );
  }

  return context;
};
