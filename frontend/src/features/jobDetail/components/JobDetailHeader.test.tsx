import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
    expect(screen.queryByRole('link', { name: 'Open posting' })).toBeInTheDocument();
  });

  it('renders optional job actions when handlers are provided', async () => {
    const user = userEvent.setup();
    const handleDeleteJob = vi.fn();
    const handleEditJob = vi.fn();
    renderWithProviders(
      <JobDetailHeader
        job={mockJobDetails[0]}
        onDeleteJob={handleDeleteJob}
        onEditJob={handleEditJob}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit job' }));
    await user.click(screen.getByRole('button', { name: 'Delete job' }));

    expect(handleEditJob).toHaveBeenCalledTimes(1);
    expect(handleDeleteJob).toHaveBeenCalledTimes(1);
  });

  it('shows tooltips for icon-only header actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <JobDetailHeader job={mockJobDetails[0]} onDeleteJob={vi.fn()} onEditJob={vi.fn()} />,
    );

    await user.hover(screen.getByRole('link', { name: 'Open posting' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Open posting');

    await user.hover(screen.getByRole('button', { name: 'Edit job' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Edit job');

    await user.hover(screen.getByRole('button', { name: 'Delete job' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete job');
  });

  it('omits optional job actions when handlers are not provided', () => {
    renderWithProviders(<JobDetailHeader job={mockJobDetails[0]} />);

    expect(screen.queryByRole('button', { name: 'Edit job' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete job' })).not.toBeInTheDocument();
  });

  it('updates status and omits the external link when no URL exists', async () => {
    const user = userEvent.setup();
    const handleStatusChange = vi.fn();
    renderWithProviders(
      <JobDetailHeader
        job={{
          ...mockJobDetails[0],
          jobUrl: '',
        }}
        onStatusChange={handleStatusChange}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Job status' }), 'OFFER');

    expect(handleStatusChange).toHaveBeenCalledWith('OFFER');
    expect(screen.queryByRole('link', { name: 'Open posting' })).not.toBeInTheDocument();
  });
});
