import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ImportCandidatesSection } from './ImportCandidatesSection';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockJob } from '../../../test/mockJobs';
import type { TImportCandidateResponse, TImportCandidateResult } from '../../../services';

/*
 * Task 049: importing the selected candidates as jobs, from the candidate
 * review section.
 */

const candidate = (
  id: string,
  company: string,
  reviewStatus: TImportCandidateResponse['reviewStatus'] = 'PENDING',
): TImportCandidateResponse => ({
  content: { company, description: 'Text', location: 'Berlin', roleTitle: 'Engineer' },
  createdAt: '2026-10-01T09:00:00Z',
  duplicateStatus: 'UNCHECKED',
  id,
  reviewStatus,
  source: 'MANUAL',
  sourceUrl: null,
  updatedAt: '2026-10-01T09:00:00Z',
});

const imported = (candidateId: string, jobId: string): TImportCandidateResult => ({
  candidateId,
  errorCode: null,
  jobId,
  outcome: 'IMPORTED',
});

const renderSection = (overrides: Partial<ComponentProps<typeof ImportCandidatesSection>> = {}) => {
  const props: ComponentProps<typeof ImportCandidatesSection> = {
    candidates: [candidate('c1', 'N26'), candidate('c2', 'Zalando'), candidate('c3', 'Personio')],
    createCandidate: vi.fn(),
    deleteCandidate: vi.fn(),
    importCandidates: vi.fn(async (ids: string[]) => ids.map((id) => imported(id, `job-${id}`))),
    isLoading: false,
    isMutating: false,
    jobs: { error: null, isLoading: false, jobs: [], reload: vi.fn() },
    loadError: null,
    mutationError: null,
    reload: vi.fn(),
    updateCandidate: vi.fn(),
    ...overrides,
  };

  return { ...renderWithProviders(<ImportCandidatesSection {...props} />), props };
};

describe('ImportCandidatesSection import', () => {
  it('imports only the selected candidates, and only after confirmation', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.click(screen.getByRole('checkbox', { name: 'Select Engineer at Zalando' }));
    await user.click(screen.getByRole('button', { name: 'Import selected (2)' }));

    expect(props.importCandidates).not.toHaveBeenCalled();

    const confirmation = screen.getByRole('group', {
      name: 'Import the selected candidates as saved jobs?',
    });

    expect(
      within(confirmation)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Engineer at N26', 'Engineer at Personio']);

    await user.click(within(confirmation).getByRole('button', { name: 'Import 2 as jobs' }));

    expect(props.importCandidates).toHaveBeenCalledWith(['c1', 'c3']);
    expect(screen.getByRole('status')).toHaveTextContent('Imported 2 as saved jobs');
    expect(props.jobs.reload).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole('group', { name: 'Import the selected candidates as saved jobs?' }),
    ).not.toBeInTheDocument();
  });

  it('imports nothing when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.click(screen.getByRole('button', { name: 'Import selected (3)' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.importCandidates).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('group', { name: 'Import the selected candidates as saved jobs?' }),
    ).not.toBeInTheDocument();
  });

  it('cannot start an import with nothing selected', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(screen.getByRole('button', { name: 'Import selected (0)' })).toBeDisabled();
  });

  it('warns in the confirmation when a likely duplicate is selected', async () => {
    const user = userEvent.setup();
    renderSection({
      candidates: [candidate('c1', 'N26')],
      jobs: {
        error: null,
        isLoading: false,
        jobs: [createMockJob({ company: 'N26', id: 'j', roleTitle: 'Engineer' })],
        reload: vi.fn(),
      },
    });

    await user.click(screen.getByRole('checkbox', { name: 'Select Engineer at N26' }));
    await user.click(screen.getByRole('button', { name: 'Import selected (1)' }));

    expect(screen.getByText('Likely already saved as a job: 1')).toBeInTheDocument();
  });

  it('names each failed candidate with its reason next to the successes', async () => {
    const user = userEvent.setup();
    renderSection({
      importCandidates: vi.fn(async () => [
        imported('c1', 'job-1'),
        {
          candidateId: 'c2',
          errorCode: 'IMPORT_CANDIDATE_ALREADY_IMPORTED',
          jobId: null,
          outcome: 'FAILED' as const,
        },
        { candidateId: 'c3', errorCode: 'SOMETHING_ELSE', jobId: null, outcome: 'FAILED' as const },
      ]),
    });

    await user.click(screen.getByRole('button', { name: 'Import selected (3)' }));
    await user.click(screen.getByRole('button', { name: 'Import 3 as jobs' }));

    expect(screen.getByRole('status')).toHaveTextContent('Imported 1 as saved jobs');

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('2 could not be imported');
    expect(alert).toHaveTextContent('Engineer at Zalando: already imported');
    expect(alert).toHaveTextContent('Engineer at Personio: the job could not be saved');
  });

  it('keeps the confirmation flow safe when the request itself fails', async () => {
    const user = userEvent.setup();
    const { props } = renderSection({
      importCandidates: vi.fn(async () => Promise.reject(new Error('x'))),
    });

    await user.click(screen.getByRole('button', { name: 'Import selected (3)' }));
    await user.click(screen.getByRole('button', { name: 'Import 3 as jobs' }));

    expect(props.jobs.reload).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows imported candidates as imported, unselectable, and not editable', () => {
    renderSection({ candidates: [candidate('c1', 'N26', 'IMPORTED'), candidate('c2', 'Zalando')] });

    const checkbox = screen.getByRole('checkbox', { name: 'Select Engineer at N26' });

    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('Berlin · Entered manually · Imported as a job')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Correct Engineer at N26' })).toBeDisabled();
    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();
  });
});
