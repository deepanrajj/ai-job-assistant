import { describe, expect, it } from 'vitest';

import {
  countApplicationDocuments,
  getDocumentTypeColumns,
  groupDocumentsByJob,
} from './applications.utils';
import { MOCK_JOB_IDS, createMockJobs } from '../../test/mockJobs';
import type { TApplicationDocument } from './applications.types';

const documents: TApplicationDocument[] = [
  { id: 'd1', jobId: MOCK_JOB_IDS.personio, submittedAt: '2026-05-12', title: 'CV', type: 'CV' },
  { id: 'd2', jobId: MOCK_JOB_IDS.celonis, submittedAt: '2026-05-10', title: 'CV', type: 'CV' },
  { id: 'd3', jobId: MOCK_JOB_IDS.celonis, title: 'Portfolio', type: 'PORTFOLIO' },
  { id: 'd4', jobId: 'deleted-job', submittedAt: '2026-05-01', title: 'Orphan', type: 'OTHER' },
];

describe('countApplicationDocuments', () => {
  it('counts submitted and unsent documents and their jobs, leaving out deleted jobs', () => {
    const groups = groupDocumentsByJob(createMockJobs(), documents);

    expect(countApplicationDocuments(groups)).toEqual({ jobs: 2, notSent: 1, submitted: 2 });
  });

  it('counts nothing without documents', () => {
    expect(countApplicationDocuments([])).toEqual({ jobs: 0, notSent: 0, submitted: 0 });
  });
});

describe('getDocumentTypeColumns', () => {
  it('lists the types in use, in column order, leaving out deleted jobs', () => {
    const groups = groupDocumentsByJob(createMockJobs(), [
      ...documents,
      { id: 'd5', jobId: MOCK_JOB_IDS.celonis, title: 'Letter', type: 'COVER_LETTER' },
    ]);

    expect(getDocumentTypeColumns(groups)).toEqual(['CV', 'COVER_LETTER', 'PORTFOLIO']);
  });
});
