import type { ReactElement } from 'react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import type { RenderOptions } from '@testing-library/react';

import { renderWithProviders } from './renderWithProviders';

/**
 * Options used by the shared router test renderer.
 */
interface IRenderWithRouterOptions extends RenderOptions {
  initialEntries?: MemoryRouterProps['initialEntries'];
}

/**
 * Renders tested UI with app providers and an in-memory router.
 *
 * @param {ReactElement} ui React element under test.
 * @param {IRenderWithRouterOptions} options Optional router and render options.
 * @returns {ReturnType<typeof renderWithProviders>} Testing Library render result.
 */
export const renderWithRouter = (
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: IRenderWithRouterOptions = {},
): ReturnType<typeof renderWithProviders> =>
  renderWithProviders(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>, options);
