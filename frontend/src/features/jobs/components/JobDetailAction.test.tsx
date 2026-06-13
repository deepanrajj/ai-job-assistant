import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobDetailAction } from './JobDetailAction';
import { renderWithRouter } from '../../../test/renderWithRouter';

describe('JobDetailAction', () => {
  it('renders an icon-only accessible link to the job detail page', () => {
    renderWithRouter(<JobDetailAction company="Acme" detailPath="/jobs/job-001" />);

    expect(screen.getByRole('link', { name: 'View details for Acme' })).toHaveAttribute(
      'href',
      '/jobs/job-001',
    );
    expect(screen.queryByText('View details')).not.toBeInTheDocument();
  });
});
