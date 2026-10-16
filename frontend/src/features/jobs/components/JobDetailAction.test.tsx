import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobDetailAction } from './JobDetailAction';
import { renderWithRouter } from '../../../test/renderWithRouter';

describe('JobDetailAction', () => {
  it('renders a labelled link to the job detail page, named with the company', () => {
    renderWithRouter(<JobDetailAction company="Acme" detailPath="/jobs/job-001" />);

    const link = screen.getByRole('link', { name: 'Open job for Acme' });

    expect(link).toHaveAttribute('href', '/jobs/job-001');
    expect(link).toHaveTextContent('Open job');
  });

  it('applies label classes to the visible text only, keeping the accessible name', () => {
    renderWithRouter(
      <JobDetailAction
        company="Acme"
        detailPath="/jobs/job-001"
        labelClassName="lg:hidden 2xl:inline"
      />,
    );

    expect(screen.getByText('Open job')).toHaveClass('lg:hidden', '2xl:inline');
    expect(screen.getByRole('link', { name: 'Open job for Acme' })).not.toHaveClass('lg:hidden');
  });
});
