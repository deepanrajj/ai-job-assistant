import { afterEach, describe, expect, it, vi } from 'vitest';

import { createJobFormDefaultValues, createJobFormPayload } from './jobForm.utils';
import { createMockJob } from '../../test/mockJobs';
import type { TJobFormValues } from './jobFormSchema';

const formValues: TJobFormValues = {
  company: 'Acme GmbH',
  description: ' Build frontend workflows. ',
  jobUrl: ' https://example.com/job ',
  location: ' Berlin ',
  nextStep: ' Follow up ',
  roleTitle: 'Frontend Engineer',
  salaryMax: '90000',
  salaryMin: '70000',
  status: 'APPLIED',
  tags: 'React, TypeScript, , Accessibility',
};

describe('job form utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates empty default values for a new job', () => {
    expect(createJobFormDefaultValues()).toEqual({
      company: '',
      description: '',
      jobUrl: '',
      location: '',
      nextStep: '',
      roleTitle: '',
      salaryMax: '',
      salaryMin: '',
      status: 'WISHLIST',
      tags: '',
    });
  });

  it('creates edit default values from an existing job', () => {
    expect(createJobFormDefaultValues(createMockJob())).toEqual({
      company: 'Acme GmbH',
      description: '',
      jobUrl: 'https://example.com/jobs/frontend',
      location: 'Berlin',
      nextStep: 'Follow up',
      roleTitle: 'Frontend Engineer',
      salaryMax: '90000',
      salaryMin: '70000',
      status: 'APPLIED',
      tags: 'React, TypeScript',
    });
  });

  it('creates a normalized new job payload', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123);

    expect(createJobFormPayload(formValues, undefined, '2026-06-13T10:00:00.000Z')).toEqual({
      company: 'Acme GmbH',
      createdAt: '2026-06-13T10:00:00.000Z',
      description: 'Build frontend workflows.',
      id: expect.stringMatching(/^job-/),
      jobUrl: 'https://example.com/job',
      location: 'Berlin',
      nextStep: 'Follow up',
      roleTitle: 'Frontend Engineer',
      salaryMax: 90000,
      salaryMin: 70000,
      status: 'APPLIED',
      tags: ['React', 'TypeScript', 'Accessibility'],
      updatedAt: '2026-06-13T10:00:00.000Z',
    });
  });

  it('preserves identity and created date when creating an edit payload', () => {
    const job = createMockJob();

    expect(
      createJobFormPayload(
        {
          ...formValues,
          description: '',
          jobUrl: '',
          location: '',
          nextStep: '',
          salaryMax: '',
          salaryMin: '',
          tags: '',
        },
        job,
        '2026-06-13T10:00:00.000Z',
      ),
    ).toEqual({
      company: 'Acme GmbH',
      createdAt: job.createdAt,
      description: undefined,
      id: job.id,
      jobUrl: undefined,
      location: undefined,
      nextStep: undefined,
      roleTitle: 'Frontend Engineer',
      salaryMax: undefined,
      salaryMin: undefined,
      status: 'APPLIED',
      tags: [],
      updatedAt: '2026-06-13T10:00:00.000Z',
    });
  });
});
