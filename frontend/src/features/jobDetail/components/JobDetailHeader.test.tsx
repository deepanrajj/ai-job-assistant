import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobDetailHeader } from './JobDetailHeader';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailHeader', () => {
  it('renders metadata with the salary fallback when salary is not set', () => {
    renderWithProviders(
      <JobDetailHeader
        job={{
          ...mockJobDetails[0],
          salaryMax: 0,
          salaryMin: 0,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeInTheDocument();
    expect(screen.getByText('Not set')).toBeInTheDocument();
    expect(screen.getByText('Prepare product analytics case study')).toBeInTheDocument();
  });
});
