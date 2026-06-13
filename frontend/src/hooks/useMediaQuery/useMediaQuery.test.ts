import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useBreakpoint, useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  it('returns the current media query match', () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === '(min-width: 768px)',
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    expect(renderHook(() => useMediaQuery('(min-width: 768px)')).result.current).toBe(true);
    expect(renderHook(() => useBreakpoint('lg')).result.current).toBe(false);
  });
});
