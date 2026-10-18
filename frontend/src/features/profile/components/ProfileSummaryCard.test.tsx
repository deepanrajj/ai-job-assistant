import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import { ProfileSummaryCard } from './ProfileSummaryCard';
import { renderWithProviders } from '../../../test/renderWithProviders';

const account = {
  headline: 'Backend Engineer',
  location: 'Munich, Germany',
  name: 'Ada Lovelace King',
  tags: ['Kotlin', 'Remote friendly'],
};

describe('ProfileSummaryCard', () => {
  it('shows the name, headline, location, and tags in a named region', () => {
    renderWithProviders(<ProfileSummaryCard account={account} />);

    const region = screen.getByRole('region', { name: 'Account summary' });

    expect(within(region).getByRole('heading', { name: 'Ada Lovelace King' })).toBeInTheDocument();
    expect(region).toHaveTextContent('Backend Engineer · Munich, Germany');
    expect(
      within(region)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Kotlin', 'Remote friendly']);
  });

  it('says in words that it shows sample data', () => {
    renderWithProviders(<ProfileSummaryCard account={account} />);

    expect(screen.getByText('Sample data')).toBeInTheDocument();
  });

  it('shows up to two initials, hidden from assistive technology', () => {
    renderWithProviders(<ProfileSummaryCard account={account} />);

    const avatar = screen.getByText('AL');

    expect(avatar).toHaveAttribute('aria-hidden', 'true');
  });
});
