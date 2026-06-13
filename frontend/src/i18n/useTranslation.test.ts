import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useTranslation } from './useTranslation';
import { AppError } from '../errors';
import { APP_ERROR_CODES } from '../types';

describe('useTranslation', () => {
  it('throws AppError when used outside TranslationProvider', () => {
    expect(() => renderHook(() => useTranslation())).toThrow(AppError);
    expect(() => renderHook(() => useTranslation())).toThrow(
      expect.objectContaining({
        code: APP_ERROR_CODES.TRANSLATION_PROVIDER_MISSING,
      }),
    );
  });
});
