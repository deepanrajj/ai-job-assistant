import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { JobsPage } from './JobsPage';
import { renderWithRouter } from '../../test/renderWithRouter';
import { createMockJobs } from '../../test/mockJobs';

describe('JobsPage', () => {
  it('searches saved jobs by company name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JobsPage jobs={createMockJobs()} />);

    expect(screen.getByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search'), 'personio');

    expect(screen.getByRole('rowheader', { name: /Personio/i })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Celonis/i })).not.toBeInTheDocument();
  });

  it('filters saved jobs by status', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JobsPage jobs={createMockJobs()} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'INTERVIEW');

    expect(screen.getByRole('rowheader', { name: /Celonis/i })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Personio/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Miro/i })).not.toBeInTheDocument();
  });
});
