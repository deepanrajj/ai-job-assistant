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
  // notes, contacts, reminders, or timeline tab only to assert unrelated
  // tab-switching or page behaviour. An empty list is always a safe default
  // for those; a test that cares what tasks, notes, contacts, reminders, or
  // timeline events render calls `server.use` with its own handler. The
  // same holds for the dashboard's next reminders and status history, which
  // any test rendering the dashboard route requests alongside its own
  // `GET /api/jobs`.
  http.get('/api/jobs/:jobId/tasks', () => HttpResponse.json([])),
  http.get('/api/jobs/:jobId/notes', () => HttpResponse.json([])),
  http.get('/api/jobs/:jobId/contacts', () => HttpResponse.json([])),
  http.get('/api/jobs/:jobId/documents', () => HttpResponse.json([])),
  http.get('/api/application-documents', () => HttpResponse.json([])),
  http.get('/api/jobs/:jobId/reminders', () => HttpResponse.json([])),
  http.get('/api/reminders/next', () => HttpResponse.json([])),
  // The dashboard's status history: one empty page. A test that cares what
  // history the insights see calls `server.use` with its own pages.
  http.get('/api/timeline-events', () =>
    HttpResponse.json({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }),
  ),
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
