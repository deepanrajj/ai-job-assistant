import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobDetailOverviewPanel } from './JobDetailOverviewPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailOverviewPanel', () => {
  it('renders the job description', () => {
    renderWithProviders(<JobDetailOverviewPanel job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByText(/Build customer-facing analytics workflows/)).toBeInTheDocument();
  });
});
