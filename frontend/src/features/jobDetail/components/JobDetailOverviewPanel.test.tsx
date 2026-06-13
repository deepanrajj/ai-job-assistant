import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobDetailOverviewPanel } from './JobDetailOverviewPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailOverviewPanel', () => {
  it('renders description, preparation focus, and skills', () => {
    renderWithProviders(<JobDetailOverviewPanel job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByText(/Build customer-facing analytics workflows/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preparation focus' })).toBeInTheDocument();
    expect(screen.getByText('Prepare product analytics case study')).toBeInTheDocument();
    expect(screen.getByText('Design System')).toBeInTheDocument();
  });
});
