import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useLocalToday } from './useLocalToday';

describe('useLocalToday', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the same value during the day', () => {
    vi.setSystemTime(new Date(2026, 9, 4, 9, 0));
    const { result } = renderHook(() => useLocalToday());
    const morning = result.current;

    act(() => {
      vi.advanceTimersByTime(14 * 60 * 60 * 1000);
    });

    expect(result.current).toBe(morning);
  });

  it('moves to the new day just after local midnight, and again the next night', () => {
    vi.setSystemTime(new Date(2026, 9, 4, 23, 59, 30));
    const { result } = renderHook(() => useLocalToday());

    expect(result.current.getDate()).toBe(4);

    act(() => {
      vi.advanceTimersByTime(31 * 1000);
    });

    expect(result.current.getDate()).toBe(5);

    act(() => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    });

    expect(result.current.getDate()).toBe(6);
  });

  it('stops its timer when unmounted', () => {
    vi.setSystemTime(new Date(2026, 9, 4, 23, 59, 30));
    const { unmount } = renderHook(() => useLocalToday());

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
