import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { JobDetailActivePanel } from './JobDetailActivePanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

const createActionProps = () => ({
  job: mockJobDetails[0],
  onAnalyzeJob: vi.fn(),
  onCreateNote: vi.fn(),
  onCreateTask: vi.fn(),
  onDeleteNote: vi.fn(),
  onDeleteTask: vi.fn(),
  onUpdateNote: vi.fn(),
  onUpdateTask: vi.fn(),
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

  it('binds the current job id to task actions', async () => {
    const user = userEvent.setup();
    const actionProps = createActionProps();

    renderWithProviders(<JobDetailActivePanel activeTab="tasks" {...actionProps} />);

    await user.type(screen.getByLabelText('Task title'), 'Practice architecture');
    await user.type(screen.getByLabelText('Due date'), '2026-06-20');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    await user.click(
      screen.getByRole('checkbox', { name: 'Tailor CV bullets for Senior Frontend Engineer' }),
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Delete task Tailor CV bullets for Senior Frontend Engineer',
      }),
    );

    expect(actionProps.onCreateTask).toHaveBeenCalledWith(
      'job-001',
      'Practice architecture',
      '2026-06-20',
    );
    expect(actionProps.onUpdateTask).toHaveBeenCalledWith('job-001', 'job-001-task-1', {
      status: 'TODO',
    });
    expect(actionProps.onDeleteTask).toHaveBeenCalledWith('job-001', 'job-001-task-1');
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
