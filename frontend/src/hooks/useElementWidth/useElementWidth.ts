import { useLayoutEffect, useState } from 'react';

/**
 * Tracks the rendered width of an element, so a component can choose its
 * layout from the room it actually has rather than from the viewport.
 *
 * The first measurement happens before paint, so a layout chosen from the
 * width never flashes the wrong way first; a `ResizeObserver` then follows
 * later changes. The width is null until something measures it: a zero
 * width, as jsdom reports for every element, counts as unmeasured, and
 * callers fall back to a viewport breakpoint then.
 *
 * @returns {[(node: HTMLElement | null) => void, number | null]} A callback ref for the element, and its width in pixels.
 */
export const useElementWidth = (): [(node: HTMLElement | null) => void, number | null] => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!node) return;

    const updateWidth = (measured: number) => setWidth(measured > 0 ? measured : null);

    updateWidth(node.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => updateWidth(entry.contentRect.width));

    observer.observe(node);

    return () => observer.disconnect();
  }, [node]);

  return [setNode, width];
};
