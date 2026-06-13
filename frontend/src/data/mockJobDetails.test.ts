import { describe, expect, it } from 'vitest';

import { mockJobDetails } from './mockJobDetails';
import { mockJobs } from './mockJobs';

describe('mockJobDetails', () => {
  it('creates one rich detail record for each mock job', () => {
    expect(mockJobDetails).toHaveLength(mockJobs.length);
    expect(mockJobDetails.map((job) => job.id)).toEqual(mockJobs.map((job) => job.id));
  });

  it('adds tasks, notes, timeline, and AI insights to each job detail', () => {
    const [jobDetail] = mockJobDetails;

    expect(jobDetail.description).toBe(mockJobs[0].description);
    expect(jobDetail.jobUrl).toBe(mockJobs[0].jobUrl);
    expect(jobDetail.tasks).toEqual([
      expect.objectContaining({
        id: 'job-001-task-1',
        status: 'DONE',
        title: 'Tailor CV bullets for Senior Frontend Engineer',
      }),
      expect.objectContaining({
        id: 'job-001-task-2',
        status: 'TODO',
        title: 'Prepare product analytics case study',
      }),
    ]);
    expect(jobDetail.notes[0].body).toContain('Saved the role because Celonis');
    expect(jobDetail.timeline[0].description).toBe('Celonis was added to the tracker.');
    expect(jobDetail.aiInsights.summary).toContain('Celonis is a strong match');
    expect(jobDetail.aiInsights.strengths).toContain('Existing experience maps well to React.');
  });
});
