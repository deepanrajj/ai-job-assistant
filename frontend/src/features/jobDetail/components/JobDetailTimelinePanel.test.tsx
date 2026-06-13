import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobDetailTimelinePanel } from './JobDetailTimelinePanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailTimelinePanel', () => {
  it('renders timeline events with descriptions and dates', () => {
    renderWithProviders(<JobDetailTimelinePanel job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
    expect(screen.getByText('Job saved')).toBeInTheDocument();
    expect(screen.getByText('Celonis was added to the tracker.')).toBeInTheDocument();
    expect(screen.getByText('Status updated')).toBeInTheDocument();
    expect(screen.getByText('Current status is INTERVIEW.')).toBeInTheDocument();
  });
});
