import { http, HttpResponse } from 'msw';

import type { TJobAiAnalysis } from '../types';

/**
 * Default API handlers shared by frontend tests.
 */
export const handlers = [
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
