import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppError } from '../errors';
import { APP_ERROR_CODES } from '../types';
import { useTranslation } from './useTranslation';

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
