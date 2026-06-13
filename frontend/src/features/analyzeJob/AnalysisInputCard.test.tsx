import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { AnalysisInputCard } from './AnalysisInputCard';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { TAnalyzeJobFormValues } from './analyzeJobFormSchema';

/**
 * Props used by the analysis input card test wrapper.
 */
interface IAnalysisInputCardTestProps {
  error?: string;
  isLoading?: boolean;
  onAnalyze: SubmitHandler<TAnalyzeJobFormValues>;
}

const AnalysisInputCardTest = ({
  error = '',
  isLoading = false,
  onAnalyze,
}: IAnalysisInputCardTestProps) => {
  const form = useForm<TAnalyzeJobFormValues>({
    defaultValues: {
      description: '',
    },
  });

  return (
    <AnalysisInputCard error={error} form={form} isLoading={isLoading} onAnalyze={onAnalyze} />
  );
};

describe('AnalysisInputCard', () => {
  it('submits the pasted job description', async () => {
    const user = userEvent.setup();
    const onAnalyze = vi.fn();
    renderWithProviders(<AnalysisInputCardTest onAnalyze={onAnalyze} />);

    await user.type(screen.getByLabelText('Job description input'), 'Senior React engineer role');
    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }));

    await waitFor(() =>
      expect(onAnalyze).toHaveBeenCalledWith(
        {
          description: 'Senior React engineer role',
        },
        expect.anything(),
      ),
    );
  });

  it('disables submit while loading and shows errors when provided', () => {
    renderWithProviders(
      <AnalysisInputCardTest
        error="Failed to analyze job description"
        isLoading
        onAnalyze={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Analyzing...' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to analyze job description');
  });
});
