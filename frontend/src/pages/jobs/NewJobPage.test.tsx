import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { NewJobPage } from './NewJobPage';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';

/**
 * Renders the page at `/jobs/new` with a sibling jobs route, so a
 * successful create can be observed as a real navigation.
 */
const renderNewJobPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: '/jobs/new',
        element: <NewJobPage />,
      },
      {
        path: '/jobs',
        element: <p>Jobs route</p>,
      },
    ],
    {
      initialEntries: ['/jobs/new'],
    },
  );

  return renderWithProviders(<RouterProvider router={router} />);
};

describe('NewJobPage', () => {
  it('renders an empty add job form', () => {
    renderNewJobPage();

    expect(screen.getByRole('heading', { name: 'Add job' })).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('WISHLIST');
  });

  it('creates the job through the API and returns to jobs', async () => {
    const user = userEvent.setup();
    let body: unknown;

    server.use(
      http.post('/api/jobs', async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(createMockJobResponse(), { status: 201 });
      }),
    );
    renderNewJobPage();

    await user.type(screen.getByLabelText('Company'), 'Acme GmbH');
    await user.type(screen.getByLabelText('Role'), 'Frontend Engineer');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    await waitFor(() =>
      expect(body).toMatchObject({
        company: 'Acme GmbH',
        roleTitle: 'Frontend Engineer',
        status: 'WISHLIST',
      }),
    );
    expect(await screen.findByText('Jobs route')).toBeInTheDocument();
  });

  it('blocks an invalid submit without calling the API', async () => {
    const user = userEvent.setup();
    const createHandler = vi.fn(() => HttpResponse.json(createMockJobResponse(), { status: 201 }));

    server.use(http.post('/api/jobs', createHandler));
    renderNewJobPage();

    await user.click(screen.getByRole('button', { name: 'Create job' }));

    expect(await screen.findByText('Company is required.')).toBeInTheDocument();
    expect(createHandler).not.toHaveBeenCalled();
    expect(screen.queryByText('Jobs route')).not.toBeInTheDocument();
  });

  it('keeps the entered values and announces the error when the API fails', async () => {
    const user = userEvent.setup();

    server.use(http.post('/api/jobs', () => new HttpResponse(null, { status: 500 })));
    renderNewJobPage();

    await user.type(screen.getByLabelText('Company'), 'Acme GmbH');
    await user.type(screen.getByLabelText('Role'), 'Frontend Engineer');
    await user.type(screen.getByLabelText('Description'), 'Long description worth keeping');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Job could not be created');
    expect(alert).toHaveTextContent('Failed to create job');

    // The point of the error state is that nothing the user typed is lost.
    expect(screen.getByLabelText('Company')).toHaveValue('Acme GmbH');
    expect(screen.getByLabelText('Role')).toHaveValue('Frontend Engineer');
    expect(screen.getByLabelText('Description')).toHaveValue('Long description worth keeping');
    expect(screen.queryByText('Jobs route')).not.toBeInTheDocument();
  });

  it('disables the submit button while the create is in flight', async () => {
    const user = userEvent.setup();
    let release = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const createHandler = vi.fn(async () => {
      await released;

      return HttpResponse.json(createMockJobResponse(), { status: 201 });
    });

    server.use(http.post('/api/jobs', createHandler));
    renderNewJobPage();

    await user.type(screen.getByLabelText('Company'), 'Acme GmbH');
    await user.type(screen.getByLabelText('Role'), 'Frontend Engineer');

    const submitButton = screen.getByRole('button', { name: 'Create job' });

    await user.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());

    // A second click on a slow save would otherwise create a second job:
    // the endpoint has no idempotency key and no duplicate detection.
    await user.click(submitButton);

    release();

    expect(await screen.findByText('Jobs route')).toBeInTheDocument();
    expect(createHandler).toHaveBeenCalledTimes(1);
  });

  it('returns to jobs when cancelled', async () => {
    const user = userEvent.setup();

    renderNewJobPage();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('Jobs route')).toBeInTheDocument();
  });
});
