import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobDetailAiPanel } from './JobDetailAiPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailAiPanel', () => {
  it('renders saved AI summary, strengths, and gaps', () => {
    renderWithProviders(<JobDetailAiPanel job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'AI summary' })).toBeInTheDocument();
    expect(screen.getByText(/Celonis is a strong match/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Strengths' })).toBeInTheDocument();
    expect(screen.getByText('Existing experience maps well to React.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gaps to prepare' })).toBeInTheDocument();
    expect(
      screen.getByText('Collect one recent project story that proves Design System impact.'),
    ).toBeInTheDocument();
  });
});
