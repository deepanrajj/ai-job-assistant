import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobDetailTasksPanel } from './JobDetailTasksPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailTasksPanel', () => {
  it('renders task completion summary, task rows, and due dates', () => {
    renderWithProviders(<JobDetailTasksPanel job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Preparation tasks' })).toBeInTheDocument();
    expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Tailor CV bullets for Senior Frontend Engineer' }),
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Prepare product analytics case study' }),
    ).not.toBeChecked();
    expect(screen.getByText('Due May 10, 2026')).toBeInTheDocument();
  });
});
