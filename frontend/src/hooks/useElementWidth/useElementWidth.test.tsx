import { afterEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { useElementWidth } from './useElementWidth';

/**
 * Renders the measured width, or "unknown" before any measurement.
 */
const WidthProbe = () => {
  const [ref, width] = useElementWidth();

  return <div ref={ref}>{width ?? 'unknown'}</div>;
};

describe('useElementWidth', () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('stays unknown where ResizeObserver does not exist', () => {
    // jsdom has no ResizeObserver; make that explicit for this case.
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
    render(<WidthProbe />);

    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('reports the width the observer measures, and stops observing on unmount', () => {
    let report: ((width: number) => void) | undefined;
    let disconnected = false;

    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        report = (width) =>
          callback(
            [{ contentRect: { width } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
      }

      disconnect() {
        disconnected = true;
      }

      observe() {}

      unobserve() {}
    } as unknown as typeof ResizeObserver;

    const { unmount } = render(<WidthProbe />);

    act(() => report?.(512));
    expect(screen.getByText('512')).toBeInTheDocument();

    unmount();
    expect(disconnected).toBe(true);
  });
});
