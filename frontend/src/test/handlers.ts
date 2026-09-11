import { http, HttpResponse } from 'msw';

import { createMockJobResponses } from './mockJobs';
import type { TJobAiAnalysis } from '../types';
import type { TJobResponse } from '../services';

/**
 * Default API handlers shared by frontend tests.
 */
export const handlers = [
  http.get('/api/jobs', () => HttpResponse.json<TJobResponse[]>(createMockJobResponses())),
  http.post('/api/ai/analyze-job', () =>
    HttpResponse.json<TJobAiAnalysis>({
      niceToHaveSkills: ['Testing Library'],
      prepTasks: ['Review accessible form labels'],
      requiredSkills: ['React', 'TypeScript'],
      seniority: 'Senior',
      summary: 'The role is a strong frontend engineering match.',
    }),
  ),
  http.post('/api/ai/ask-job', () =>
    HttpResponse.json({
      answer: 'Focus on React architecture and accessibility examples.',
    }),
  ),
];
