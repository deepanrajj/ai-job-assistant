import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { useJobTimeline } from './useJobTimeline';
import { MOCK_JOB_IDS } from '../../test/mockJobs';
import { MOCK_TIMELINE_EVENT_IDS, createMockTimelineEventResponse } from '../../test/mockTimeline';
import { server } from '../../test/server';

const JobTimelineProbe = () => {
  const { events, isLoading, loadError, reload } = useJobTimeline(MOCK_JOB_IDS.celonis);

  if (isLoading) return <p>loading</p>;
  if (loadError)
    return (
      <div>
        <p>load-error: {loadError.message}</p>
        <button onClick={reload}>retry</button>
      </div>
    );

  return (
    <ul>
      {events.map((event) => (
        <li key={event.id}>{event.description}</li>
      ))}
    </ul>
  );
};

describe('useJobTimeline', () => {
  it('loads and maps timeline events', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/timeline`, () =>
        HttpResponse.json([
          createMockTimelineEventResponse({ id: MOCK_TIMELINE_EVENT_IDS.primary }),
        ]),
      ),
    );
    render(<JobTimelineProbe />);

    expect(
      await screen.findByText('Status changed from APPLIED to INTERVIEW.'),
    ).toBeInTheDocument();
  });

  it('records a load error and retries', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/timeline`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json({ message: 'boom' }, { status: 500 })
          : HttpResponse.json([
              createMockTimelineEventResponse({ id: MOCK_TIMELINE_EVENT_IDS.primary }),
            ]);
      }),
    );
    const user = userEvent.setup();
    render(<JobTimelineProbe />);

    expect(await screen.findByText(/load-error:/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'retry' }));

    expect(
      await screen.findByText('Status changed from APPLIED to INTERVIEW.'),
    ).toBeInTheDocument();
  });
});
