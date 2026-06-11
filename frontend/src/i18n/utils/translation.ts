import { LANGUAGE_STORAGE_KEY, resources, supportedLanguages } from '../constants';
import type {
  TLanguage,
  TTranslationParams,
  TTranslationResource,
  TTranslationValue,
} from '../i18n.types';

/**
 * Checks whether a stored or external value is one of the supported language codes.
 *
 * @param value Candidate language value.
 * @returns {boolean} True when the value is a supported language code.
 */
export const isLanguage = (value: string | null): value is TLanguage =>
  value !== null && supportedLanguages.includes(value as TLanguage);

/**
 * Resolves the initial app language from localStorage, then falls back to browser language.
 *
 * @returns {TLanguage} Supported language code to use on first render.
 */
export const getInitialLanguage = (): TLanguage => {
  if (typeof window === 'undefined') return 'en';

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isLanguage(storedLanguage)) return storedLanguage;

  return window.navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
};

/**
 * Replaces named placeholders in translated messages with runtime values.
 *
 * @param message Translation message that may contain {{placeholder}} tokens.
 * @param params Optional interpolation values keyed by placeholder name.
 * @returns {string} Message with placeholders replaced by stringified values.
 */
export const interpolate = (message: string, params?: TTranslationParams) => {
  if (!params) return message;

  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    message,
  );
};

/**
 * Reads a nested translation message using a dot-separated translation key.
 *
 * @param resource Translation resource object for one language.
 * @param key Dot-separated translation path, such as "jobs.savedJobs".
 * @returns {string | undefined} Matching translation string, or undefined when the key is missing or not a string.
 */
export const getNestedMessage = (resource: TTranslationResource, key: string) => {
  const value = key.split('.').reduce<TTranslationValue | undefined>((currentValue, keyPart) => {
    if (!currentValue || typeof currentValue === 'string') return undefined;
    return currentValue[keyPart];
  }, resource);

  return typeof value === 'string' ? value : undefined;
};

/**
 * Resolves a translated message outside React components.
 *
 * @param key Dot-separated translation path.
 * @param params Optional interpolation values keyed by placeholder name.
 * @param language Language used for the lookup. Defaults to the active browser language.
 * @returns {string} Translated and interpolated message, or the key when no message exists.
 */
export const translate = (
  key: string,
  params?: TTranslationParams,
  language: TLanguage = getInitialLanguage(),
): string => {
  const message = getNestedMessage(resources[language], key) ?? key;
  return interpolate(message, params);
};
