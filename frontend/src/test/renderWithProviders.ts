import { render, type RenderOptions } from '@testing-library/react';
import { createElement, type ReactElement, type ReactNode } from 'react';

import { JobsProvider } from '../features/jobs';
import { TranslationProvider } from '../i18n';

/**
 * Props used by the shared test provider wrapper.
 */
interface ITestProvidersProps {
  children: ReactNode;
}

/**
 * Wraps tested UI with app providers required by most components.
 *
 * @param {ITestProvidersProps} props Component props.
 * @returns {ReactElement} Provider-wrapped children.
 */
const TestProviders = ({ children }: ITestProvidersProps): ReactElement =>
  createElement(TranslationProvider, null, createElement(JobsProvider, null, children));

/**
 * Renders UI with the same core providers used by the application.
 *
 * @param {ReactElement} ui React element under test.
 * @param {RenderOptions} options Optional Testing Library render options.
 * @returns {ReturnType<typeof render>} Testing Library render result.
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions,
): ReturnType<typeof render> =>
  render(ui, {
    wrapper: TestProviders,
    ...options,
  });
