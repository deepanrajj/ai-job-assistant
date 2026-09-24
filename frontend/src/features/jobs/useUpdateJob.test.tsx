import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { http, HttpResponse } from 'msw';

import { useUpdateJob } from './useUpdateJob';
import { MOCK_JOB_IDS, createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';
import type { TJobFormPayload } from '../../services';

const jobFields: TJobFormPayload = {
  company: 'Northwind Systems',
  description: undefined,
  jobUrl: undefined,
  location: undefined,
  roleTitle: 'Platform Engineer',
  salaryMax: undefined,
  salaryMin: undefined,
  status: 'APPLIED',
};

const UpdateJobProbe = () => {
  const { error, isSaving, saveJob } = useUpdateJob();
  const [saved, setSaved] = useState<string>('');

  return (
    <div>
      <button
        onClick={() => {
          saveJob({ fields: jobFields, jobId: MOCK_JOB_IDS.celonis })
            .then((job) => setSaved(`${job.company} location=${String(job.location)}`))
            .catch(() => undefined);
        }}
      >
        save
      </button>
      <p>saving={String(isSaving)}</p>
      {saved && <p>saved: {saved}</p>}
      {error && <p>error: {error.message}</p>}
    </div>
  );
};

const jobEndpoint = `/api/jobs/${MOCK_JOB_IDS.celonis}`;

describe('useUpdateJob', () => {
  it('puts every editable field to the job url, with explicit nulls', async () => {
    const user = userEvent.setup();
    let body: unknown;
    let method = '';

    server.use(
      http.put(jobEndpoint, async ({ request }) => {
        body = await request.json();
        method = request.method;

        return HttpResponse.json(createMockJobResponse({ id: MOCK_JOB_IDS.celonis }));
      }),
    );
    render(<UpdateJobProbe />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    // An update replaces every editable field and the backend defaults none
    // of them, so a cleared value has to travel as an explicit null rather
    // than as an omitted key.
    await waitFor(() =>
      expect(body).toEqual({
        company: 'Northwind Systems',
        description: null,
        jobUrl: null,
        location: null,
        roleTitle: 'Platform Engineer',
        salaryMax: null,
        salaryMin: null,
        source: null,
        status: 'APPLIED',
      }),
    );
    expect(method).toBe('PUT');
  });

  it('resolves with the updated job in the UI model', async () => {
    const user = userEvent.setup();

    server.use(
      http.put(jobEndpoint, () =>
        HttpResponse.json(
          createMockJobResponse({
            company: 'Northwind Systems',
            id: MOCK_JOB_IDS.celonis,
            location: null,
          }),
        ),
      ),
    );
    render(<UpdateJobProbe />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText(/^saved:/)).toHaveTextContent(
      'Northwind Systems location=undefined',
    );
  });

  it('records a failed update', async () => {
    const user = userEvent.setup();

    server.use(http.put(jobEndpoint, () => new HttpResponse(null, { status: 500 })));
    render(<UpdateJobProbe />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText(/^error:/)).toHaveTextContent('Failed to update job');
    expect(screen.getByText('saving=false')).toBeInTheDocument();
  });

  it('records a 2xx that carries no job as a failure', async () => {
    const user = userEvent.setup();

    // `parseJsonResponse` resolves a 204 as undefined, which would otherwise
    // reach the response mapper and throw past every error state.
    server.use(http.put(jobEndpoint, () => new HttpResponse(null, { status: 204 })));
    render(<UpdateJobProbe />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText(/^error:/)).toHaveTextContent('Failed to update job');
    expect(screen.queryByText(/^saved:/)).not.toBeInTheDocument();
  });
});
