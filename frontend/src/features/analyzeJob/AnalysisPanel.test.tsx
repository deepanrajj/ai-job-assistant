import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { AnalysisPanel } from './AnalysisPanel';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { TJobAiAnalysis } from '../../types';

const analysis: TJobAiAnalysis = {
  niceToHaveSkills: ['Testing Library'],
  prepTasks: ['Prepare accessibility examples'],
  requiredSkills: ['React', 'TypeScript'],
  seniority: 'Senior',
  summary: 'This role matches a frontend engineer profile.',
};

describe('AnalysisPanel', () => {
  it('renders the empty analysis guidance before a result exists', () => {
    renderWithProviders(<AnalysisPanel analysis={null} description="" status="idle" />);

    expect(screen.getByRole('heading', { name: 'AI Analysis' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Paste a job description and click "Analyze with AI" to see the results here.',
      ),
    ).toBeInTheDocument();
  });

  it('renders the loading skeleton as a status region', () => {
    renderWithProviders(<AnalysisPanel analysis={null} description="" status="loading" />);

    expect(screen.getByRole('status', { name: 'Analyzing job description' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
  });

  it('renders structured analysis sections and the follow-up question form', () => {
    renderWithProviders(
      <AnalysisPanel analysis={analysis} description="React frontend role" status="success" />,
    );

    expect(screen.getByText('This role matches a frontend engineer profile.')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Testing Library')).toBeInTheDocument();
    expect(screen.getByText('Senior')).toBeInTheDocument();
    expect(screen.getByText('Prepare accessibility examples')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
  });
});
