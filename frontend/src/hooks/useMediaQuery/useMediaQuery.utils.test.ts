import { describe, expect, it, vi } from 'vitest';

import {
  getBreakpointMediaQuery,
  getDefaultMediaQuerySnapshot,
  getMediaQuerySnapshot,
  subscribeToMediaQuery,
} from './useMediaQuery.utils';

describe('useMediaQuery utils', () => {
  it('builds breakpoint queries and default snapshots', () => {
    expect(getBreakpointMediaQuery('md')).toBe('(min-width: 768px)');
    expect(getDefaultMediaQuerySnapshot()).toBe(false);
  });

  it('reads and subscribes to media query changes', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const onStoreChange = vi.fn();

    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      addEventListener,
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === '(min-width: 768px)',
      media: query,
      onchange: null,
      removeEventListener,
      removeListener: vi.fn(),
    }));

    expect(getMediaQuerySnapshot('(min-width: 768px)')).toBe(true);

    const unsubscribe = subscribeToMediaQuery('(min-width: 768px)', onStoreChange);
    const handleChange = addEventListener.mock.calls[0][1] as () => void;

    handleChange();
    unsubscribe();

    expect(onStoreChange).toHaveBeenCalledTimes(1);
    expect(removeEventListener).toHaveBeenCalledWith('change', handleChange);
  });
});
