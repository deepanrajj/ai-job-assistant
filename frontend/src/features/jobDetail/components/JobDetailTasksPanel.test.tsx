import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
    expect(screen.queryByLabelText('Task title')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Delete task Tailor CV bullets for Senior Frontend Engineer',
      }),
    ).not.toBeInTheDocument();
  });

  it('disables task updates when no update handler is provided', () => {
    renderWithProviders(<JobDetailTasksPanel job={mockJobDetails[0]} />);

    expect(
      screen.getByRole('checkbox', { name: 'Tailor CV bullets for Senior Frontend Engineer' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'Prepare product analytics case study' }),
    ).toBeDisabled();
  });

  it('creates, updates, and deletes tasks', async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn();
    const onDeleteTask = vi.fn();
    const onUpdateTask = vi.fn();
    renderWithProviders(
      <JobDetailTasksPanel
        job={mockJobDetails[0]}
        onCreateTask={onCreateTask}
        onDeleteTask={onDeleteTask}
        onUpdateTask={onUpdateTask}
      />,
    );

    await user.type(screen.getByLabelText('Task title'), 'Practice system design');
    await user.type(screen.getByLabelText('Due date'), '2026-06-20');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(onCreateTask).toHaveBeenCalledWith('Practice system design', '2026-06-20');

    await user.click(
      screen.getByRole('checkbox', { name: 'Tailor CV bullets for Senior Frontend Engineer' }),
    );
    expect(onUpdateTask).toHaveBeenCalledWith('job-001-task-1', {
      status: 'TODO',
    });
    await user.click(
      screen.getByRole('checkbox', { name: 'Prepare product analytics case study' }),
    );
    expect(onUpdateTask).toHaveBeenCalledWith('job-001-task-2', {
      status: 'DONE',
    });

    await user.click(
      screen.getByRole('button', {
        name: 'Delete task Tailor CV bullets for Senior Frontend Engineer',
      }),
    );
    expect(onDeleteTask).toHaveBeenCalledWith('job-001-task-1');
  });

  it('ignores empty task submissions', () => {
    const onCreateTask = vi.fn();
    renderWithProviders(
      <JobDetailTasksPanel job={mockJobDetails[0]} onCreateTask={onCreateTask} />,
    );

    fireEvent.submit(screen.getByLabelText('Task title').closest('form')!);

    expect(onCreateTask).not.toHaveBeenCalled();
  });
});
