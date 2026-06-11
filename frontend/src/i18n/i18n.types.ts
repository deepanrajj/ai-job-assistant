/**
 * Supported language codes for the frontend translation system.
 */
export type TLanguage = 'en' | 'de';

/**
 * Values available for interpolation in translated messages.
 */
export type TTranslationParams = Record<string, string | number>;

/**
 * Shape exposed through TranslationContext.
 */
export type TTranslationContextValue = {
  language: TLanguage;
  setLanguage: (language: TLanguage) => void;
  t: (key: string, params?: TTranslationParams) => string;
};

/**
 * Recursive value type for nested translation JSON resources.
 */
export type TTranslationValue = string | { [key: string]: TTranslationValue };

/**
 * Top-level translation resource shape for one locale file.
 */
export type TTranslationResource = { [key: string]: TTranslationValue };
