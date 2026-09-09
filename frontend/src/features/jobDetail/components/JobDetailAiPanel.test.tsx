import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailAiPanel } from './JobDetailAiPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';
import type { TJobAiAnalysis } from '../../../types';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailAiPanel', () => {
  it('renders saved AI summary, strengths, and gaps', () => {
    renderWithProviders(<JobDetailAiPanel job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Saved AI analysis' })).toBeInTheDocument();
    expect(screen.getByText(/Celonis is a strong match/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Strengths' })).toBeInTheDocument();
    expect(screen.getByText('Existing experience maps well to React.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gaps to prepare' })).toBeInTheDocument();
    expect(
      screen.getByText('Collect one recent project story that proves Design System impact.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ask AI' })).toBeInTheDocument();
  });

  it('analyzes the saved description and exposes the result to the parent', async () => {
    const user = userEvent.setup();
    const handleAnalyzeJob = vi.fn();
    // The response is held open until this test releases it, so the
    // loading state lasts as long as the assertion needs rather than for
    // a fixed delay the assertion has to catch mid-flight.
    const pendingResponse: { release: () => void } = { release: () => {} };
    const responseReleased = new Promise<void>((resolve) => {
      pendingResponse.release = resolve;
    });
    server.use(
      http.post('/api/ai/analyze-job', async () => {
        await responseReleased;

        return HttpResponse.json<TJobAiAnalysis>({
          niceToHaveSkills: ['Testing Library'],
          prepTasks: ['Review accessible form labels'],
          requiredSkills: ['React', 'TypeScript'],
          seniority: 'Senior',
          summary: 'The role is a strong frontend engineering match.',
        });
      }),
    );
    renderWithProviders(
      <JobDetailAiPanel job={mockJobDetails[0]} onAnalyzeJob={handleAnalyzeJob} />,
    );

    await user.click(screen.getByRole('button', { name: 'Analyze saved job' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Analyzing...' })).toBeDisabled(),
    );

    pendingResponse.release();

    await waitFor(() =>
      expect(handleAnalyzeJob).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'The role is a strong frontend engineering match.',
        }),
      ),
    );
  });

  it('shows an error when saved job analysis fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/ai/analyze-job', () =>
        HttpResponse.json(
          {
            message: 'AI service failed.',
          },
          {
            status: 500,
          },
        ),
      ),
    );
    renderWithProviders(<JobDetailAiPanel job={mockJobDetails[0]} />);

    await user.click(screen.getByRole('button', { name: 'Analyze saved job' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('AI service failed.');
  });

  it('can analyze without a parent save callback', async () => {
    const user = userEvent.setup();
    renderWithProviders(<JobDetailAiPanel job={mockJobDetails[0]} />);

    await user.click(screen.getByRole('button', { name: 'Analyze saved job' }));

    expect(await screen.findByRole('button', { name: 'Analyze saved job' })).toBeEnabled();
  });

  it('renders an empty state when no insights are saved', () => {
    renderWithProviders(
      <JobDetailAiPanel
        job={{
          ...mockJobDetails[0],
          aiInsights: {
            gaps: [],
            strengths: [],
            summary: '',
          },
          description: '',
        }}
      />,
    );

    expect(screen.getByText('No saved AI insights yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze saved job' })).toBeDisabled();
  });
});
