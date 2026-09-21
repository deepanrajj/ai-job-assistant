import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailActivePanel } from './JobDetailActivePanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockTaskResponse } from '../../../test/mockTasks';
import { server } from '../../../test/server';
import { mockJobDetails } from '../../../data/mockJobDetails';

const createActionProps = () => ({
  job: mockJobDetails[0],
  onAnalyzeJob: vi.fn(),
  onCreateNote: vi.fn(),
  onDeleteNote: vi.fn(),
  onUpdateNote: vi.fn(),
});

describe('JobDetailActivePanel', () => {
  it('renders the selected read-only panel', () => {
    const { rerender } = renderWithProviders(
      <JobDetailActivePanel activeTab="overview" job={mockJobDetails[0]} />,
    );

    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument();

    rerender(<JobDetailActivePanel activeTab="timeline" job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
  });

  it('passes the current job id to the tasks panel', async () => {
    server.use(
      http.get(`/api/jobs/${mockJobDetails[0].id}/tasks`, () =>
        HttpResponse.json([createMockTaskResponse({ title: 'Practice architecture' })]),
      ),
    );

    renderWithProviders(<JobDetailActivePanel activeTab="tasks" {...createActionProps()} />);

    expect(await screen.findByText('Practice architecture')).toBeInTheDocument();
  });

  it('binds the current job id to note actions', async () => {
    const user = userEvent.setup();
    const actionProps = createActionProps();

    renderWithProviders(<JobDetailActivePanel activeTab="notes" {...actionProps} />);

    await user.type(screen.getByLabelText('New note'), 'Ask about team rituals');
    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.clear(screen.getByLabelText('Edit note from May 10, 2026'));
    await user.type(screen.getByLabelText('Edit note from May 10, 2026'), 'Updated note');
    await user.click(screen.getByRole('button', { name: 'Save note from May 10, 2026' }));
    await user.click(screen.getByRole('button', { name: 'Delete note from May 10, 2026' }));

    expect(actionProps.onCreateNote).toHaveBeenCalledWith('job-001', 'Ask about team rituals');
    expect(actionProps.onUpdateNote).toHaveBeenCalledWith(
      'job-001',
      'job-001-note-1',
      'Updated note',
    );
    expect(actionProps.onDeleteNote).toHaveBeenCalledWith('job-001', 'job-001-note-1');
  });

  it('binds the current job id to the AI analysis action', async () => {
    const user = userEvent.setup();
    const actionProps = createActionProps();

    renderWithProviders(<JobDetailActivePanel activeTab="ai" {...actionProps} />);

    await user.click(screen.getByRole('button', { name: 'Analyze saved job' }));

    await waitFor(() =>
      expect(actionProps.onAnalyzeJob).toHaveBeenCalledWith(
        'job-001',
        expect.objectContaining({
          summary: 'The role is a strong frontend engineering match.',
        }),
      ),
    );
  });
});
