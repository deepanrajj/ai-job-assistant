import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { JobsProvider } from './JobsProvider';
import { useJobs } from './useJobs';
import { createMockJob } from '../../test/mockJobs';
import { mockJobDetails } from '../../data/mockJobDetails';

const STORAGE_KEY = 'smart-job-tracker-jobs';

const JobsProbe = () => {
  const {
    createJob,
    createNote,
    createTask,
    deleteJob,
    deleteNote,
    deleteTask,
    jobs,
    saveJobAiAnalysis,
    updateJob,
    updateJobStatus,
    updateNote,
    updateTask,
  } = useJobs();
  const firstJob = jobs[0];
  const firstTask = firstJob?.tasks[0];
  const firstNote = firstJob?.notes[0];

  if (!firstJob) return <p>No jobs</p>;

  return (
    <div>
      <p>{jobs.length}</p>
      <p>{firstJob?.company}</p>
      <p>{firstJob?.status}</p>
      <p>{firstJob?.tasks.length}</p>
      <p>{firstJob?.notes.length}</p>
      <button onClick={() => createJob(createMockJob({ id: 'job-new' }))}>create</button>
      <button
        onClick={() =>
          updateJob({
            ...createMockJob({ id: firstJob.id }),
            company: 'Updated GmbH',
          })
        }
      >
        update
      </button>
      <button onClick={() => updateJobStatus(firstJob.id, 'OFFER')}>status</button>
      <button onClick={() => createTask(firstJob.id, 'New task', '2026-06-20')}>create task</button>
      <button
        onClick={() => firstTask && updateTask(firstJob.id, firstTask.id, { status: 'DONE' })}
      >
        update task
      </button>
      <button onClick={() => firstTask && deleteTask(firstJob.id, firstTask.id)}>
        delete task
      </button>
      <button onClick={() => createNote(firstJob.id, 'New note')}>create note</button>
      <button onClick={() => firstNote && updateNote(firstJob.id, firstNote.id, 'Updated note')}>
        update note
      </button>
      <button onClick={() => firstNote && deleteNote(firstJob.id, firstNote.id)}>
        delete note
      </button>
      <button
        onClick={() =>
          saveJobAiAnalysis(firstJob.id, {
            niceToHaveSkills: ['Testing Library'],
            prepTasks: ['Review labels'],
            requiredSkills: ['React'],
            seniority: 'Senior',
            summary: 'Saved summary',
          })
        }
      >
        save ai
      </button>
      <button onClick={() => deleteJob(firstJob.id)}>delete</button>
    </div>
  );
};

describe('JobsProvider', () => {
  it('loads jobs from storage and persists mutations', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([mockJobDetails[0]]));
    render(
      <JobsProvider>
        <JobsProbe />
      </JobsProvider>,
    );

    expect(screen.getByText('Celonis')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'create' }));
    expect(screen.getByText('Acme GmbH')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'update' }));
    expect(screen.getByText('Updated GmbH')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'status' }));
    expect(screen.getByText('OFFER')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'create task' }));
    await user.click(screen.getByRole('button', { name: 'update task' }));
    await user.click(screen.getByRole('button', { name: 'delete task' }));
    await user.click(screen.getByRole('button', { name: 'create note' }));
    await user.click(screen.getByRole('button', { name: 'update note' }));
    await user.click(screen.getByRole('button', { name: 'delete note' }));
    await user.click(screen.getByRole('button', { name: 'save ai' }));
    await user.click(screen.getByRole('button', { name: 'delete' }));

    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual(
        expect.arrayContaining([expect.objectContaining({ company: 'Celonis' })]),
      ),
    );
  });
});
