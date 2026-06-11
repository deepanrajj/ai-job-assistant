import de from './locales/de.json';
import en from './locales/en.json';
import type { TLanguage, TTranslationResource } from './i18n.types';

/**
 * Browser storage key used to persist the user's selected language.
 */
export const LANGUAGE_STORAGE_KEY = 'smart-job-tracker-language';

/**
 * Language codes currently supported by the frontend.
 */
export const supportedLanguages: TLanguage[] = ['en', 'de'];

/**
 * Translation resources keyed by supported language code.
 */
export const resources = { en, de } satisfies Record<TLanguage, TTranslationResource>;
