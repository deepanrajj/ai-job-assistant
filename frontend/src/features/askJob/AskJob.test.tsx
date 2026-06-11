import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../test/server';
import { AskJob } from './AskJob';

describe('AskJob', () => {
  it('keeps the ask button disabled until a question is entered', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AskJob description="React frontend role" />);

    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();

    await user.type(screen.getByLabelText('Question for AI assistant'), 'What should I prepare?');

    expect(screen.getByRole('button', { name: 'Ask' })).toBeEnabled();
  });

  it('shows an AppError alert when no description context exists', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AskJob description=" " />);

    await user.type(screen.getByLabelText('Question for AI assistant'), 'What should I prepare?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please paste a job description first.',
    );
  });

  it('renders the loading skeleton while the follow-up question is being answered', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/ai/ask-job', async () => {
        await delay(100);

        return HttpResponse.json({
          answer: 'Delayed answer',
        });
      }),
    );
    renderWithProviders(<AskJob description="React frontend role" />);

    await user.type(screen.getByLabelText('Question for AI assistant'), 'What should I prepare?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByRole('button', { name: 'Asking...' })).toBeDisabled();
    expect(screen.getByRole('status', { name: 'Asking...' })).toBeInTheDocument();
    expect(await screen.findByText('Delayed answer')).toBeInTheDocument();
  });

  it('submits a follow-up question and renders the AI answer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AskJob description="React frontend role" />);

    await user.type(screen.getByLabelText('Question for AI assistant'), 'What should I prepare?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Ask' })).toBeEnabled());
    expect(screen.getByRole('status')).toHaveTextContent('AI Answer');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Focus on React architecture and accessibility examples.',
    );
  });
});
