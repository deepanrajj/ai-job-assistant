import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { AnalyzeJobPage } from './AnalyzeJobPage';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../test/server';

describe('AnalyzeJobPage', () => {
  it('validates an empty description before requesting analysis', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnalyzeJobPage />);

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }));

    expect(await screen.findByText('Please paste a job description first.')).toBeInTheDocument();
  });

  it('analyzes a pasted job description and renders the result', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnalyzeJobPage />);

    await user.type(
      screen.getByLabelText('Job description input'),
      'We need a senior React engineer with TypeScript and accessibility experience.',
    );
    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }));

    expect(
      await screen.findByText('The role is a strong frontend engineering match.'),
    ).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Review accessible form labels')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
  });

  it('shows the API error message when analysis fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/ai/analyze-job', () =>
        HttpResponse.json(
          {
            message: 'Analyzer is unavailable',
          },
          {
            status: 500,
          },
        ),
      ),
    );
    renderWithProviders(<AnalyzeJobPage />);

    await user.type(screen.getByLabelText('Job description input'), 'React role');
    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Analyzer is unavailable');
  });
});
