import { http, HttpResponse } from 'msw';

import type { TJobAiAnalysis } from '../types';

/**
 * Default API handlers shared by frontend tests.
 *
 * Deliberately no `GET /api/jobs`. `setupTests.ts` sets
 * `onUnhandledRequest: 'error'`, so a test that renders a jobs-fetching
 * component has to declare its own handler through `server.use` rather than
 * silently inheriting fixture rows.
 */
export const handlers = [
  // Unlike `GET /api/jobs` above, several tests open the job detail tasks,
  // notes, or timeline tab only to assert unrelated tab-switching or page
  // behaviour. An empty list is always a safe default for those; a test
  // that cares what tasks, notes, or timeline events render calls
  // `server.use` with its own handler.
  http.get('/api/jobs/:jobId/tasks', () => HttpResponse.json([])),
  http.get('/api/jobs/:jobId/notes', () => HttpResponse.json([])),
  http.get('/api/jobs/:jobId/timeline', () => HttpResponse.json([])),
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
