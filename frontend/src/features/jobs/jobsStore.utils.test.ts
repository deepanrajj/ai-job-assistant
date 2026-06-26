import { describe, expect, it, vi, afterEach } from 'vitest';

import {
  addStoredJob,
  addStoredJobNote,
  addStoredJobTask,
  createJobDetailFromJob,
  createJobTimelineEvent,
  deleteStoredJob,
  deleteStoredJobNote,
  deleteStoredJobTask,
  readStoredJobs,
  saveStoredJobAiAnalysis,
  updateStoredJob,
  updateStoredJobNote,
  updateStoredJobStatus,
  updateStoredJobTask,
  writeStoredJobs,
} from './jobsStore.utils';
import { createMockJob } from '../../test/mockJobs';
import type { TJobAiAnalysis, TJobDetail } from '../../types';
import { mockJobDetails } from '../../data/mockJobDetails';

const analysis: TJobAiAnalysis = {
  niceToHaveSkills: ['Testing Library'],
  prepTasks: ['Prepare accessibility story'],
  requiredSkills: ['React'],
  seniority: 'Senior',
  summary: 'Strong match.',
};

describe('jobs store utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates timeline events and detail records from base jobs', () => {
    vi.spyOn(Date, 'now').mockReturnValue(100);
    const job = createMockJob({
      description: undefined,
      jobUrl: undefined,
      location: undefined,
      nextStep: undefined,
      salaryMax: undefined,
      salaryMin: undefined,
    });

    expect(createJobTimelineEvent(job.id, 'Created', 'Job created.', job.createdAt)).toEqual({
      createdAt: job.createdAt,
      description: 'Job created.',
      id: expect.stringMatching(/^job-001-timeline-/),
      title: 'Created',
    });
    expect(createJobDetailFromJob(job)).toMatchObject({
      aiInsights: {
        gaps: [],
        strengths: [],
        summary: '',
      },
      description: '',
      jobUrl: '',
      location: '',
      salaryMax: 0,
      salaryMin: 0,
    });
  });

  it('adds, updates, and deletes saved jobs', () => {
    const job = createMockJob({ id: 'job-new' });
    const addedJobs = addStoredJob(mockJobDetails, job);

    expect(addedJobs[0]).toMatchObject({
      id: 'job-new',
      timeline: [expect.objectContaining({ title: 'Job saved' })],
    });

    const updatedJobs = updateStoredJob(addedJobs, {
      ...job,
      company: 'Updated GmbH',
      updatedAt: '2026-06-13T10:00:00.000Z',
    });

    expect(updatedJobs[0].company).toBe('Updated GmbH');
    expect(updatedJobs[0].timeline[0]).toMatchObject({ title: 'Job updated' });
    expect(deleteStoredJob(updatedJobs, 'job-new')).toHaveLength(mockJobDetails.length);
  });

  it('updates jobs that do not have optional base fields', () => {
    const job = createJobDetailFromJob(
      createMockJob({
        id: 'minimal-job',
        jobUrl: undefined,
        location: undefined,
        nextStep: undefined,
        salaryMax: undefined,
        salaryMin: undefined,
      }),
    );

    const updatedJobs = updateStoredJob([job], {
      ...createMockJob({
        id: 'minimal-job',
        jobUrl: undefined,
        location: undefined,
        nextStep: undefined,
        salaryMax: undefined,
        salaryMin: undefined,
      }),
      company: 'Minimal GmbH',
    });

    expect(updatedJobs[0]).toMatchObject({
      company: 'Minimal GmbH',
      jobUrl: '',
      location: '',
      nextStep: '',
      salaryMax: 0,
      salaryMin: 0,
    });
  });

  it('updates status, tasks, notes, and AI analysis', () => {
    vi.spyOn(Date, 'now').mockReturnValue(200);
    const jobs = [mockJobDetails[0]];
    const statusJobs = updateStoredJobStatus(jobs, 'job-001', 'OFFER', '2026-06-13T10:00:00.000Z');

    expect(statusJobs[0].status).toBe('OFFER');
    expect(statusJobs[0].timeline[0]).toMatchObject({ title: 'Status updated' });

    const taskJobs = addStoredJobTask(
      statusJobs,
      'job-001',
      'Prepare examples',
      '2026-06-20',
      '2026-06-13T10:00:00.000Z',
    );
    const taskId = taskJobs[0].tasks.at(-1)?.id ?? '';

    expect(taskJobs[0].tasks.at(-1)).toMatchObject({
      dueDate: '2026-06-20',
      id: expect.stringMatching(/^job-001-task-/),
      status: 'TODO',
      title: 'Prepare examples',
    });
    expect(
      updateStoredJobTask(taskJobs, 'job-001', taskId, { status: 'DONE' })[0].tasks.at(-1),
    ).toMatchObject({
      status: 'DONE',
    });
    expect(deleteStoredJobTask(taskJobs, 'job-001', taskId)[0].tasks).toHaveLength(
      jobs[0].tasks.length,
    );

    const noteJobs = addStoredJobNote(
      statusJobs,
      'job-001',
      'Remember recruiter name',
      '2026-06-13T10:00:00.000Z',
    );
    const noteId = noteJobs[0].notes[0].id;

    expect(noteJobs[0].notes[0]).toMatchObject({
      body: 'Remember recruiter name',
      id: expect.stringMatching(/^job-001-note-/),
    });
    expect(updateStoredJobNote(noteJobs, 'job-001', noteId, 'Updated note')[0].notes[0].body).toBe(
      'Updated note',
    );
    expect(deleteStoredJobNote(noteJobs, 'job-001', noteId)[0].notes).toHaveLength(
      jobs[0].notes.length,
    );

    const aiJobs = saveStoredJobAiAnalysis(
      statusJobs,
      'job-001',
      analysis,
      '2026-06-13T10:00:00.000Z',
    );

    expect(aiJobs[0].aiInsights).toEqual({
      gaps: ['Testing Library'],
      strengths: ['React'],
      summary: 'Strong match.',
    });
    expect(aiJobs[0].tasks.at(-1)).toMatchObject({
      title: 'Prepare accessibility story',
    });
  });

  it('does not duplicate AI prep tasks when a matching task already exists', () => {
    const jobs: TJobDetail[] = [
      {
        ...mockJobDetails[0],
        tasks: [
          {
            dueDate: '2026-06-13T10:00:00.000Z',
            id: 'existing-task',
            status: 'TODO',
            title: 'Prepare accessibility story',
          },
        ],
      },
    ];

    expect(saveStoredJobAiAnalysis(jobs, 'job-001', analysis)[0].tasks).toHaveLength(1);
  });

  it('reads and writes jobs from localStorage', () => {
    const storage = window.localStorage;

    writeStoredJobs(storage, 'test-jobs', [mockJobDetails[0]]);
    expect(readStoredJobs(storage, 'test-jobs')).toEqual([mockJobDetails[0]]);

    storage.setItem('invalid-json', '{');
    expect(readStoredJobs(storage, 'invalid-json')).toEqual(mockJobDetails);

    storage.setItem('not-array', JSON.stringify({ jobs: [] }));
    expect(readStoredJobs(storage, 'not-array')).toEqual(mockJobDetails);

    storage.setItem('malformed-array', JSON.stringify([{ id: 'broken' }]));
    expect(readStoredJobs(storage, 'malformed-array')).toEqual(mockJobDetails);

    storage.setItem(
      'base-job-array',
      JSON.stringify([
        createMockJob({
          id: 'stored-base-job',
        }),
      ]),
    );
    expect(readStoredJobs(storage, 'base-job-array')[0]).toMatchObject({
      aiInsights: {
        gaps: [],
        strengths: [],
        summary: '',
      },
      id: 'stored-base-job',
      notes: [],
      tasks: [],
      timeline: [expect.objectContaining({ title: 'Job saved' })],
    });

    expect(readStoredJobs(storage, 'missing-key')).toEqual(mockJobDetails);
  });
});
