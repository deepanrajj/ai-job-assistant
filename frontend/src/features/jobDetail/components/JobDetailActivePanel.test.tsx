import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { JobDetailActivePanel } from './JobDetailActivePanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailActivePanel', () => {
  it('renders the selected read-only panel', () => {
    const { rerender } = renderWithProviders(
      <JobDetailActivePanel activeTab="overview" job={mockJobDetails[0]} />,
    );

    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument();

    rerender(<JobDetailActivePanel activeTab="timeline" job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
  });

  it('binds the current job id to task, note, and AI actions', async () => {
    const user = userEvent.setup();
    const onAnalyzeJob = vi.fn();
    const onCreateNote = vi.fn();
    const onCreateTask = vi.fn();
    const onDeleteNote = vi.fn();
    const onDeleteTask = vi.fn();
    const onUpdateNote = vi.fn();
    const onUpdateTask = vi.fn();
    const actionProps = {
      job: mockJobDetails[0],
      onAnalyzeJob,
      onCreateNote,
      onCreateTask,
      onDeleteNote,
      onDeleteTask,
      onUpdateNote,
      onUpdateTask,
    };
    const { rerender } = renderWithProviders(
      <JobDetailActivePanel activeTab="tasks" {...actionProps} />,
    );

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

    expect(onCreateTask).toHaveBeenCalledWith('job-001', 'Practice architecture', '2026-06-20');
    expect(onUpdateTask).toHaveBeenCalledWith('job-001', 'job-001-task-1', {
      status: 'TODO',
    });
    expect(onDeleteTask).toHaveBeenCalledWith('job-001', 'job-001-task-1');

    rerender(<JobDetailActivePanel activeTab="notes" {...actionProps} />);

    await user.type(screen.getByLabelText('New note'), 'Ask about team rituals');
    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.clear(screen.getByLabelText('Edit note from May 10, 2026'));
    await user.type(screen.getByLabelText('Edit note from May 10, 2026'), 'Updated note');
    await user.click(screen.getByRole('button', { name: 'Save note from May 10, 2026' }));
    await user.click(screen.getByRole('button', { name: 'Delete note from May 10, 2026' }));

    expect(onCreateNote).toHaveBeenCalledWith('job-001', 'Ask about team rituals');
    expect(onUpdateNote).toHaveBeenCalledWith('job-001', 'job-001-note-1', 'Updated note');
    expect(onDeleteNote).toHaveBeenCalledWith('job-001', 'job-001-note-1');

    rerender(<JobDetailActivePanel activeTab="ai" {...actionProps} />);

    await user.click(screen.getByRole('button', { name: 'Analyze saved job' }));

    await waitFor(() =>
      expect(onAnalyzeJob).toHaveBeenCalledWith(
        'job-001',
        expect.objectContaining({
          summary: 'The role is a strong frontend engineering match.',
        }),
      ),
    );
  });
});
