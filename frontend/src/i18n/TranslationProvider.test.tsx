import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TranslationProvider } from './TranslationProvider';
import { useTranslation } from './useTranslation';
import { LANGUAGE_STORAGE_KEY } from './constants';

const TranslationProbe = () => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div>
      <p>{language}</p>
      <p>{t('jobs.countSummary', { shown: 2, total: 4 })}</p>
      <button onClick={() => setLanguage('de')} type="button">
        German
      </button>
    </div>
  );
};

describe('TranslationProvider', () => {
  it('provides translated copy and persists language changes', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    render(
      <TranslationProvider>
        <TranslationProbe />
      </TranslationProvider>,
    );

    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('2 of 4 opportunities shown')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'German' }));

    expect(document.documentElement).toHaveAttribute('lang', 'de');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('de');
    expect(screen.getByText('2 von 4 Chancen angezeigt')).toBeInTheDocument();
  });
});
