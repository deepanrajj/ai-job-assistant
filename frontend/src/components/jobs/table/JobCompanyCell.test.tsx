import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { JobCompanyCell } from './JobCompanyCell';

describe('JobCompanyCell', () => {
  it('renders a company with an external posting link when a URL exists', () => {
    renderWithProviders(<JobCompanyCell company="Acme" jobUrl="https://example.com/job" />);

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open posting for Acme' })).toHaveAttribute(
      'href',
      'https://example.com/job',
    );
  });

  it('omits the posting link when no URL exists', () => {
    renderWithProviders(<JobCompanyCell company="Acme" />);

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
