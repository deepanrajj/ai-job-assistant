import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LanguageSelect } from './LanguageSelect';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('LanguageSelect', () => {
  it('renders supported languages and updates the active language', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);

    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('en');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'de');

    expect(document.documentElement).toHaveAttribute('lang', 'de');
    expect(screen.getByRole('combobox')).toHaveValue('de');
    expect(screen.getByRole('option', { name: 'Deutsch' })).toBeInTheDocument();
  });

  it('ignores unsupported language values', () => {
    renderWithProviders(<LanguageSelect />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: {
        value: 'fr',
      },
    });

    expect(document.documentElement).toHaveAttribute('lang', 'en');
  });
});
