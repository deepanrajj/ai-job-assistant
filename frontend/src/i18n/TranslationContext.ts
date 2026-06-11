import { createContext } from 'react';

import type { TTranslationContextValue } from './i18n.types';

/**
 * React context that stores the current language state and translation function.
 */
export const TranslationContext = createContext<TTranslationContextValue | null>(null);
