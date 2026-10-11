import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FC } from 'react';
import { useForm } from 'react-hook-form';

import { JobDuplicateWarning } from './JobDuplicateWarning';
import { createJobFormDefaultValues } from '../jobForm.utils';
import { AppError } from '../../../errors';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockJob } from '../../../test/mockJobs';
import type { TJob } from '../../../types';
import type { TJobFormValues } from '../jobFormSchema';

/*
 * Task 050: the job form's non-blocking duplicate warning.
 */

// Each with its own link: the fixture's shared default link would make
// them all duplicates of one another.
const savedJob = (id: string, company: string, roleTitle: string): TJob =>
  createMockJob({ company, id, jobUrl: `https://jobs.example.com/${id}`, roleTitle });

const savedJobs = [
  savedJob('n26', 'N26 GmbH', 'Backend Engineer'),
  savedJob('n26-senior', 'N26', 'Senior Backend Engineer'),
  savedJob('zalando', 'Zalando', 'Designer'),
];

interface IHarnessProps {
  error?: AppError | null;
  excludeJobId?: string;
  initial?: TJob;
  isLoading?: boolean;
  jobs?: TJob[];
}

const Harness: FC<IHarnessProps> = ({
  error = null,
  excludeJobId,
  initial,
  isLoading = false,
  jobs = savedJobs,
}) => {
  const form = useForm<TJobFormValues>({ defaultValues: createJobFormDefaultValues(initial) });

  return (
    <>
      <input aria-label="Company" {...form.register('company')} />
      <input aria-label="Role" {...form.register('roleTitle')} />
      <input aria-label="Job URL" {...form.register('jobUrl')} />
      <JobDuplicateWarning
        control={form.control}
        excludeJobId={excludeJobId}
        jobs={{ error, isLoading, jobs }}
      />
    </>
  );
};

describe('JobDuplicateWarning', () => {
  it('lists every similar saved job with why it matches, strongest first', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Company'), 'n26');
    await user.type(screen.getByLabelText('Role'), 'backend engineer');

    const warning = screen.getByRole('status');

    expect(warning).toHaveTextContent('You may have saved this job already');
    expect(warning).toHaveTextContent('You can still save it.');
    expect(
      within(warning)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Backend Engineer at N26 GmbH (opens in a new tab) (likely duplicate: same company and role)',
      'Senior Backend Engineer at N26 (opens in a new tab) (possible duplicate: similar role at the same company)',
    ]);

    const link = within(warning).getByRole('link', { name: /Backend Engineer at N26 GmbH/ });

    expect(link).toHaveAttribute('href', '/jobs/n26');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('matches a saved job by its link', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Harness jobs={[createMockJob({ id: 'linked', jobUrl: 'https://jobs.example.com/1' })]} />,
    );

    await user.type(screen.getByLabelText('Job URL'), 'https://www.jobs.example.com/1/');

    expect(screen.getByRole('status')).toHaveTextContent('(likely duplicate: same link)');
  });

  it('warns about nothing without a match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.type(screen.getByLabelText('Company'), 'Personio');
    await user.type(screen.getByLabelText('Role'), 'Backend Engineer');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('never matches the job being edited with itself', () => {
    renderWithProviders(<Harness excludeJobId="n26" initial={savedJobs[0]} />);

    expect(within(screen.getByRole('status')).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Senior Backend Engineer at N26');
  });

  it.each([
    ['loading', { isLoading: true }],
    ['failed to load', { error: new AppError('x') }],
  ])('says nothing while the saved jobs are %s', (_state, props) => {
    renderWithProviders(<Harness {...props} initial={savedJobs[0]} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
