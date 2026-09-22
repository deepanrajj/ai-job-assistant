import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailActivePanel } from './JobDetailActivePanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockNoteResponse } from '../../../test/mockNotes';
import { createMockTaskResponse } from '../../../test/mockTasks';
import { createMockTimelineEventResponse } from '../../../test/mockTimeline';
import { server } from '../../../test/server';
import { mockJobDetails } from '../../../data/mockJobDetails';

const createActionProps = () => ({
  job: mockJobDetails[0],
  onAnalyzeJob: vi.fn(),
});

describe('JobDetailActivePanel', () => {
  it('renders the selected read-only panel', () => {
    renderWithProviders(<JobDetailActivePanel activeTab="overview" job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument();
  });

  it('passes the current job id to the tasks panel', async () => {
    server.use(
      http.get(`/api/jobs/${mockJobDetails[0].id}/tasks`, () =>
        HttpResponse.json([createMockTaskResponse({ title: 'Practice architecture' })]),
      ),
    );

    renderWithProviders(<JobDetailActivePanel activeTab="tasks" {...createActionProps()} />);

    expect(await screen.findByText('Practice architecture')).toBeInTheDocument();
  });

  it('passes the current job id to the notes panel', async () => {
    server.use(
      http.get(`/api/jobs/${mockJobDetails[0].id}/notes`, () =>
        HttpResponse.json([createMockNoteResponse({ body: 'Ask about team rituals' })]),
      ),
    );

    renderWithProviders(<JobDetailActivePanel activeTab="notes" {...createActionProps()} />);

    expect(await screen.findByText('Ask about team rituals')).toBeInTheDocument();
  });

  it('passes the current job id to the timeline panel', async () => {
    server.use(
      http.get(`/api/jobs/${mockJobDetails[0].id}/timeline`, () =>
        HttpResponse.json([
          createMockTimelineEventResponse({
            description: 'Status changed from APPLIED to INTERVIEW.',
          }),
        ]),
      ),
    );

    renderWithProviders(<JobDetailActivePanel activeTab="timeline" {...createActionProps()} />);

    expect(
      await screen.findByText('Status changed from APPLIED to INTERVIEW.'),
    ).toBeInTheDocument();
  });

  it('binds the current job id to the AI analysis action', async () => {
    const user = userEvent.setup();
    const actionProps = createActionProps();

    renderWithProviders(<JobDetailActivePanel activeTab="ai" {...actionProps} />);

    await user.click(screen.getByRole('button', { name: 'Analyze saved job' }));

    await waitFor(() =>
      expect(actionProps.onAnalyzeJob).toHaveBeenCalledWith(
        'job-001',
        expect.objectContaining({
          summary: 'The role is a strong frontend engineering match.',
        }),
      ),
    );
  });
});
