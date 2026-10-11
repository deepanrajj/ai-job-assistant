import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LanguageSelect } from './LanguageSelect';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('LanguageSelect', () => {
  it('renders supported languages and updates the active language', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);

    const switcher = screen.getByRole('group', { name: 'Language' });
    expect(within(switcher).getByRole('button', { name: 'EN English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(within(switcher).getByRole('button', { name: 'DE German' }));

    expect(document.documentElement).toHaveAttribute('lang', 'de');
    expect(screen.getByRole('group', { name: 'Sprache' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DE Deutsch' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
