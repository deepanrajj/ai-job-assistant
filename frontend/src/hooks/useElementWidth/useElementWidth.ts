import { useEffect, useState } from 'react';

/**
 * Tracks the rendered width of an element, so a component can choose its
 * layout from the room it actually has rather than from the viewport.
 *
 * The width is null until the first measurement, and stays null where
 * `ResizeObserver` does not exist, such as in jsdom; callers fall back to a
 * viewport breakpoint then.
 *
 * @returns {[(node: HTMLElement | null) => void, number | null]} A callback ref for the element, and its width in pixels.
 */
export const useElementWidth = (): [(node: HTMLElement | null) => void, number | null] => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!node || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));

    observer.observe(node);

    return () => observer.disconnect();
  }, [node]);

  return [setNode, width];
};
