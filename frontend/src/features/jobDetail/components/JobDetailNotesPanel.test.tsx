import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobDetailNotesPanel } from './JobDetailNotesPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailNotesPanel', () => {
  it('renders saved notes with localized dates', () => {
    renderWithProviders(<JobDetailNotesPanel job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByText(/Saved the role because Celonis/)).toBeInTheDocument();
    expect(screen.getByText(/Next preparation focus/)).toBeInTheDocument();
    expect(screen.getByText('May 10, 2026')).toBeInTheDocument();
  });
});
