import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailTimelinePanel } from './JobDetailTimelinePanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { MOCK_JOB_IDS } from '../../../test/mockJobs';
import { createMockTimelineEventResponse } from '../../../test/mockTimeline';
import { server } from '../../../test/server';

const TIMELINE_ENDPOINT = `/api/jobs/${MOCK_JOB_IDS.celonis}/timeline`;

describe('JobDetailTimelinePanel', () => {
  it('renders loaded timeline events with localized dates', async () => {
    server.use(
      http.get(TIMELINE_ENDPOINT, () =>
        HttpResponse.json([
          createMockTimelineEventResponse({
            description: 'Status changed from APPLIED to INTERVIEW.',
            createdAt: '2026-05-01T09:00:00.000Z',
          }),
        ]),
      ),
    );
    renderWithProviders(<JobDetailTimelinePanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(await screen.findByText('Status change')).toBeInTheDocument();
    expect(screen.getByText('Status changed from APPLIED to INTERVIEW.')).toBeInTheDocument();
  });

  it('renders the loading state', () => {
    server.use(http.get(TIMELINE_ENDPOINT, () => HttpResponse.json([])));
    renderWithProviders(<JobDetailTimelinePanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the empty state when there are no events', async () => {
    server.use(http.get(TIMELINE_ENDPOINT, () => HttpResponse.json([])));
    renderWithProviders(<JobDetailTimelinePanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(await screen.findByText('No timeline events yet')).toBeInTheDocument();
  });

  it('renders the load error with a working retry', async () => {
    let callCount = 0;
    server.use(
      http.get(TIMELINE_ENDPOINT, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json({ message: 'boom' }, { status: 500 })
          : HttpResponse.json([createMockTimelineEventResponse()]);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTimelinePanel jobId={MOCK_JOB_IDS.celonis} />);

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Timeline could not be loaded');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Status change')).toBeInTheDocument();
  });
});
