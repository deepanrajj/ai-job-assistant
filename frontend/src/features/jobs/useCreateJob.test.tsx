import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { useCreateJob } from './useCreateJob';
import { createMockJobResponse } from '../../test/mockJobs';
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
  status: 'WISHLIST',
};

const CreateJobProbe = () => {
  const { error, isSaving, saveJob } = useCreateJob();

  return (
    <div>
      <button
        onClick={() => {
          saveJob(jobFields).catch(() => undefined);
        }}
      >
        save
      </button>
      <p>saving={String(isSaving)}</p>
      {error && <p>error: {error.message}</p>}
    </div>
  );
};

describe('useCreateJob', () => {
  it('posts the editable fields with explicit nulls for the omitted ones', async () => {
    const user = userEvent.setup();
    let body: unknown;

    server.use(
      http.post('/api/jobs', async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(createMockJobResponse(), { status: 201 });
      }),
    );
    render(<CreateJobProbe />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    // The backend gives no field a default on create beyond status, and an
    // omitted key is not the same as an explicit null, so the mapper sends
    // every editable field.
    await waitFor(() =>
      expect(body).toEqual({
        company: 'Northwind Systems',
        description: null,
        jobUrl: null,
        location: null,
        roleTitle: 'Platform Engineer',
        salaryMax: null,
        salaryMin: null,
        status: 'WISHLIST',
      }),
    );
  });

  it('resolves to the created job in the UI model, with the server id', async () => {
    const user = userEvent.setup();
    let created: unknown;

    server.use(
      http.post('/api/jobs', () =>
        HttpResponse.json(createMockJobResponse({ description: null }), { status: 201 }),
      ),
    );

    const ResolvedJobProbe = () => {
      const { saveJob } = useCreateJob();

      return (
        <button
          onClick={() => {
            saveJob(jobFields)
              .then((job) => {
                created = job;
              })
              .catch(() => undefined);
          }}
        >
          save
        </button>
      );
    };

    render(<ResolvedJobProbe />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    // A wire null has to arrive as undefined, and the id must be the
    // server's rather than a locally minted one.
    await waitFor(() =>
      expect(created).toMatchObject({
        description: undefined,
        id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
      }),
    );
  });

  it('reports saving while the request is open and clears it after', async () => {
    const user = userEvent.setup();
    let release = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });

    server.use(
      http.post('/api/jobs', async () => {
        await released;

        return HttpResponse.json(createMockJobResponse(), { status: 201 });
      }),
    );
    render(<CreateJobProbe />);

    expect(screen.getByText('saving=false')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('saving=true')).toBeInTheDocument();

    release();

    expect(await screen.findByText('saving=false')).toBeInTheDocument();
  });

  it('records the failure and rejects when the API fails', async () => {
    const user = userEvent.setup();

    server.use(http.post('/api/jobs', () => new HttpResponse(null, { status: 500 })));
    render(<CreateJobProbe />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('error: Failed to create job')).toBeInTheDocument();
    expect(screen.getByText('saving=false')).toBeInTheDocument();
  });
});
