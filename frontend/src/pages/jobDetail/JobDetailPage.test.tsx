import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { JobDetailPage } from './JobDetailPage';
import { renderWithRouter } from '../../test/renderWithRouter';
import { mockJobDetails } from '../../data/mockJobDetails';

const renderJobDetailPage = (jobId = 'job-001') =>
  renderWithRouter(<JobDetailPage jobId={jobId} jobs={mockJobDetails} />);

describe('JobDetailPage', () => {
  it('renders the selected job overview from mock data', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    expect(screen.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeInTheDocument();
    expect(screen.getByText('Celonis')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview', selected: true })).toHaveClass(
      'cursor-pointer',
    );
    expect(screen.getByText('Preparation focus')).toBeInTheDocument();
    expect(screen.getAllByText('Prepare product analytics case study')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Back to jobs' }));
  });

  it('switches between job detail tabs', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(screen.getByRole('tab', { name: 'Tasks', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preparation tasks' })).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Tailor CV bullets for Senior Frontend Engineer' }),
    ).toBeChecked();

    await user.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByText(/Saved the role because Celonis/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
    expect(screen.getByText('Job saved')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'AI' }));
    expect(screen.getByRole('heading', { name: 'AI summary' })).toBeInTheDocument();
    expect(screen.getByText(/Celonis is a strong match/)).toBeInTheDocument();
  });

  it('renders an error state when the job id is unknown', async () => {
    const user = userEvent.setup();
    renderJobDetailPage('missing-job');

    expect(screen.getByRole('alert')).toHaveTextContent('Job not found');
    await user.click(screen.getByRole('button', { name: 'Back to jobs' }));
  });
});
