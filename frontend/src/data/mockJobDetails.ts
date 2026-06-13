import { mockJobs } from './mockJobs';
import type { TJob, TJobDetail } from '../types';

const mockDetailDates = [
  '2026-05-10T09:00:00.000Z',
  '2026-05-07T09:00:00.000Z',
  '2026-05-09T09:00:00.000Z',
  '2026-05-08T09:00:00.000Z',
  '2026-05-01T09:00:00.000Z',
  '2026-05-06T09:00:00.000Z',
] as const;

const createMockJobDetail = (job: TJob, date: string): TJobDetail => ({
  ...job,
  description: job.description!,
  jobUrl: job.jobUrl!,
  location: job.location!,
  nextStep: job.nextStep!,
  salaryMax: job.salaryMax!,
  salaryMin: job.salaryMin!,
  aiInsights: {
    summary: `${job.company} is a strong match for ${job.roleTitle} because the role aligns with the saved skills and current preparation focus.`,
    strengths: [
      `Existing experience maps well to ${job.tags[0]}.`,
      `The role gives a clear story around ${job.tags[1]}.`,
      'The next step is specific enough to prepare with focused examples.',
    ],
    gaps: [
      `Collect one recent project story that proves ${job.tags[2]} impact.`,
      'Prepare concise salary and availability notes before the next conversation.',
    ],
  },
  notes: [
    {
      id: `${job.id}-note-1`,
      body: `Saved the role because ${job.company} has a strong fit with the current search direction.`,
      createdAt: date,
    },
    {
      id: `${job.id}-note-2`,
      body: `Next preparation focus: ${job.nextStep}.`,
      createdAt: job.updatedAt,
    },
  ],
  tasks: [
    {
      id: `${job.id}-task-1`,
      title: `Tailor CV bullets for ${job.roleTitle}`,
      dueDate: date,
      status: 'DONE',
    },
    {
      id: `${job.id}-task-2`,
      title: job.nextStep!,
      dueDate: job.updatedAt,
      status: 'TODO',
    },
  ],
  timeline: [
    {
      id: `${job.id}-timeline-1`,
      title: 'Job saved',
      description: `${job.company} was added to the tracker.`,
      createdAt: job.createdAt,
    },
    {
      id: `${job.id}-timeline-2`,
      title: 'Status updated',
      description: `Current status is ${job.status}.`,
      createdAt: job.updatedAt,
    },
  ],
});

export const mockJobDetails: TJobDetail[] = mockJobs.map((job, index) =>
  createMockJobDetail(job, mockDetailDates[index]),
);
