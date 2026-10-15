import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ImportCandidatesSection } from './ImportCandidatesSection';
import * as duplicateUtils from '../../duplicates/duplicates.utils';
import { AppError } from '../../../errors';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockJob } from '../../../test/mockJobs';
import { APP_ERROR_CODES } from '../../../types';
import type { TImportCandidateResponse, TSaveImportCandidateRequest } from '../../../services';

const candidate = (
  id: string,
  company: string,
  overrides: Partial<TImportCandidateResponse['content']> = {},
): TImportCandidateResponse => ({
  content: {
    company,
    description: 'Build payment APIs.',
    location: 'Berlin',
    roleTitle: 'Backend Engineer',
    ...overrides,
  },
  createdAt: '2026-10-01T09:00:00Z',
  duplicateStatus: 'UNCHECKED',
  id,
  reviewStatus: 'PENDING',
  source: 'MANUAL',
  sourceUrl: null,
  updatedAt: '2026-10-01T09:00:00Z',
});

const renderSection = (overrides: Partial<ComponentProps<typeof ImportCandidatesSection>> = {}) => {
  const props: ComponentProps<typeof ImportCandidatesSection> = {
    candidates: [candidate('c1', 'N26'), candidate('c2', 'Zalando')],
    clearDeleteError: vi.fn(),
    clearSaveError: vi.fn(),
    createCandidate: vi.fn(async (payload: TSaveImportCandidateRequest) => ({
      ...candidate('c3', payload.content.company),
      ...payload,
    })),
    deleteCandidate: vi.fn(async () => {}),
    isLoading: false,
    isMutating: false,
    importCandidates: vi.fn(async () => []),
    jobs: { error: null, isLoading: false, jobs: [], reload: vi.fn() },
    loadError: null,
    deleteError: null,
    saveError: null,
    reload: vi.fn(),
    updateCandidate: vi.fn(async (_id: string, payload: TSaveImportCandidateRequest) => ({
      ...candidate('c1', payload.content.company),
      ...payload,
    })),
    ...overrides,
  };

  return { ...renderWithProviders(<ImportCandidatesSection {...props} />), props };
};

const fillRequired = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Company'), 'Personio');
  await user.type(screen.getByLabelText('Role'), 'Platform Engineer');
  await user.type(screen.getByLabelText('Job description'), 'Own the platform.');
};

describe('ImportCandidatesSection', () => {
  it('lists candidates for review with source, review state, and duplicate state', () => {
    renderSection();

    const list = screen.getByRole('list', { name: 'Candidates to review' });

    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getAllByText('Berlin · Entered manually')).toHaveLength(2);
    expect(within(list).getAllByText('Waiting for review')).toHaveLength(2);
  });

  it('lays out content beside the intake, outside the review region', () => {
    renderSection({ beside: <p>Saved searches here</p> });

    const beside = screen.getByText('Saved searches here');

    expect(screen.getByRole('heading', { name: 'Add a candidate' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Import candidates' })).not.toContainElement(beside);
  });

  it('starts with new candidates selected, and selects and clears by hand', async () => {
    const user = userEvent.setup();
    renderSection();

    expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Select Backend Engineer at N26' }));
    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.getByText('0 of 2 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Select new and possible' }));
    expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();
  });

  it('classifies candidates against saved jobs and leaves likely duplicates unselected', async () => {
    const user = userEvent.setup();
    renderSection({
      candidates: [
        { ...candidate('c1', 'N26'), sourceUrl: 'https://example.com/jobs/1' },
        candidate('c2', 'N26', { roleTitle: 'Senior Backend Engineer' }),
        candidate('c3', 'Zalando', { roleTitle: 'Designer' }),
      ],
      jobs: {
        error: null,
        isLoading: false,
        reload: vi.fn(),
        jobs: [
          createMockJob({
            company: 'N26 GmbH',
            id: 'job-1',
            jobUrl: 'https://www.example.com/jobs/1/',
            roleTitle: 'Backend Engineer',
          }),
        ],
      },
    });

    expect(
      screen.getByText('Likely duplicate: same link as Backend Engineer at N26 GmbH'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Possible duplicate: similar role at the same company as Backend Engineer at N26 GmbH',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('New: no matching saved job')).toBeInTheDocument();

    expect(
      screen.getByRole('checkbox', { name: 'Select Backend Engineer at N26' }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Select Senior Backend Engineer at N26' }),
    ).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select Designer at Zalando' })).toBeChecked();
    expect(screen.getByText('2 of 3 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Select Backend Engineer at N26' }));

    expect(screen.getByRole('checkbox', { name: 'Select Backend Engineer at N26' })).toBeChecked();
    expect(screen.getByText('3 of 3 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select new and possible' }));

    expect(
      screen.getByRole('checkbox', { name: 'Select Backend Engineer at N26' }),
    ).not.toBeChecked();
  });

  it('reuses duplicate classifications after selection and a new saved jobs wrapper', async () => {
    const user = userEvent.setup();
    const classify = vi.spyOn(duplicateUtils, 'classifyDuplicate');
    const savedJobs = [createMockJob({ company: 'N26', roleTitle: 'Backend Engineer' })];
    const { props, rerender } = renderSection({
      jobs: { error: null, isLoading: false, jobs: savedJobs, reload: vi.fn() },
    });

    expect(classify).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('checkbox', { name: 'Select Backend Engineer at N26' }));
    expect(classify).toHaveBeenCalledTimes(2);

    rerender(<ImportCandidatesSection {...props} jobs={{ ...props.jobs }} />);
    expect(classify).toHaveBeenCalledTimes(2);

    rerender(<ImportCandidatesSection {...props} jobs={{ ...props.jobs, jobs: [...savedJobs] }} />);
    expect(classify).toHaveBeenCalledTimes(4);
    classify.mockRestore();
  });

  it('preselects nothing while the saved jobs load or after they fail', () => {
    const { unmount } = renderSection({
      jobs: { error: null, isLoading: true, jobs: [], reload: vi.fn() },
    });

    expect(screen.getAllByText('Checking for duplicates')).toHaveLength(2);
    expect(screen.getByText('0 of 2 selected')).toBeInTheDocument();
    unmount();

    renderSection({
      jobs: {
        error: new AppError('Failed to load jobs', APP_ERROR_CODES.JOB_REQUEST_FAILED),
        isLoading: false,
        jobs: [],
        reload: vi.fn(),
      },
    });

    expect(screen.getAllByText('Could not check for duplicates')).toHaveLength(2);
    expect(screen.getByText('0 of 2 selected')).toBeInTheDocument();
  });

  it('explains candidates when there are none', () => {
    renderSection({ candidates: [] });

    expect(screen.getByText('No candidates yet')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Candidates to review' })).not.toBeInTheDocument();
  });

  it('saves a manual candidate with trimmed values and clears the form', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.type(screen.getByLabelText('Company'), '  Personio ');
    await user.type(screen.getByLabelText('Role'), 'Platform Engineer');
    await user.type(screen.getByLabelText('Source link'), 'https://example.com/job');
    await user.type(screen.getByLabelText('Job description'), ' Own the platform. ');
    await user.click(screen.getByRole('button', { name: 'Save candidate' }));

    expect(props.createCandidate).toHaveBeenCalledWith({
      content: {
        company: 'Personio',
        description: 'Own the platform.',
        location: '',
        roleTitle: 'Platform Engineer',
      },
      sourceUrl: 'https://example.com/job',
    });
    expect(await screen.findByLabelText('Company')).toHaveValue('');
  });

  it('shows required-field errors and saves nothing until they are fixed', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.click(screen.getByRole('button', { name: 'Save candidate' }));

    expect(screen.getAllByText('Required')).toHaveLength(3);
    expect(props.createCandidate).not.toHaveBeenCalled();
  });

  it('rejects a source link that is not http(s), keeping the draft', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await fillRequired(user);
    await user.type(screen.getByLabelText('Source link'), 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: 'Save candidate' }));

    expect(screen.getByText('Enter a valid http:// or https:// link')).toBeInTheDocument();
    expect(props.createCandidate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Company')).toHaveValue('Personio');
  });

  it('rejects a source link without a host, keeping the draft', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await fillRequired(user);
    await user.type(screen.getByLabelText('Source link'), 'https://');
    await user.click(screen.getByRole('button', { name: 'Save candidate' }));

    expect(screen.getByText('Enter a valid http:// or https:// link')).toBeInTheDocument();
    expect(props.createCandidate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Company')).toHaveValue('Personio');
  });

  it('keeps the draft and shows the error when saving fails', async () => {
    const user = userEvent.setup();
    renderSection({
      createCandidate: vi.fn(async () => Promise.reject(new Error('x'))),
      saveError: new AppError(
        'Failed to save candidate',
        APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
      ),
    });

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Save candidate' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save candidate');
    expect(screen.getByLabelText('Job description')).toHaveValue('Own the platform.');
  });

  it('renders pasted markup as text, never as HTML', async () => {
    const user = userEvent.setup();
    const markup = '<script>alert(1)</script><b>Bold</b>';
    const { container } = renderSection({
      candidates: [candidate('c1', 'N26', { description: markup })],
    });

    await user.click(screen.getByText('Description'));

    expect(screen.getByText(markup)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
  });

  it('shows the source link without the app requesting it', () => {
    renderSection({
      candidates: [{ ...candidate('c1', 'N26'), sourceUrl: 'https://example.com/job' }],
    });

    const link = screen.getByRole('link', { name: 'https://example.com/job' });

    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('corrects a saved candidate in the intake form', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.click(screen.getByRole('button', { name: 'Correct Backend Engineer at N26' }));

    expect(screen.getByLabelText('Company')).toHaveValue('N26');

    await user.clear(screen.getByLabelText('Location'));
    await user.type(screen.getByLabelText('Location'), 'Munich');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(props.updateCandidate).toHaveBeenCalledWith('c1', {
      content: {
        company: 'N26',
        description: 'Build payment APIs.',
        location: 'Munich',
        roleTitle: 'Backend Engineer',
      },
      sourceUrl: null,
    });
  });

  it('deletes a candidate', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.click(screen.getByRole('button', { name: 'Delete Backend Engineer at Zalando' }));

    expect(props.deleteCandidate).toHaveBeenCalledWith('c2');
  });

  it('shows a failed delete beside the list and a failed save in the intake', async () => {
    const user = userEvent.setup();
    const deleteError = new AppError(
      'Failed to delete candidate',
      APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
    );
    const { props, rerender } = renderSection({
      deleteCandidate: vi.fn(async () => {
        throw deleteError;
      }),
    });
    const review = screen.getByRole('region', { name: 'Import candidates' });
    const intake = screen.getByRole('region', { name: 'Add a candidate' });

    await user.click(screen.getByRole('button', { name: 'Delete Backend Engineer at Zalando' }));
    rerender(<ImportCandidatesSection {...props} deleteError={deleteError} />);

    expect(within(review).getByRole('alert')).toHaveTextContent('Failed to delete candidate');
    expect(within(intake).queryByRole('alert')).not.toBeInTheDocument();

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Save candidate' }));
    rerender(
      <ImportCandidatesSection
        {...props}
        deleteError={deleteError}
        saveError={
          new AppError('Failed to save candidate', APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED)
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Import selected/ }));
    expect(props.clearDeleteError).toHaveBeenCalledOnce();

    // Each failure stays beside its own control, even while both are set.
    expect(within(intake).getByRole('alert')).toHaveTextContent('Failed to save candidate');
    expect(within(review).getByRole('alert')).toHaveTextContent('Failed to delete candidate');
  });

  it('clears a stale error when switching between editing and adding', async () => {
    const user = userEvent.setup();
    const { props } = renderSection({
      saveError: new AppError(
        'Failed to save candidate changes',
        APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
      ),
    });

    await user.click(screen.getByRole('button', { name: 'Correct Backend Engineer at N26' }));
    expect(props.clearSaveError).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Correct Backend Engineer at Zalando' }));
    expect(props.clearSaveError).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.clearSaveError).toHaveBeenCalledTimes(3);
  });

  it('leaves edit mode after deleting the candidate being edited', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.click(screen.getByRole('button', { name: 'Correct Backend Engineer at N26' }));
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Backend Engineer at N26' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save candidate' })).toBeInTheDocument(),
    );
    expect(props.deleteCandidate).toHaveBeenCalledWith('c1');
  });

  it('shows loading and a retryable load error', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSection({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading candidates');
    unmount();

    const { props } = renderSection({
      loadError: new AppError('Failed', APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED),
    });

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(props.reload).toHaveBeenCalledOnce();
  });

  it('shows a confirmed candidate alongside a failed-load warning and retry', async () => {
    const user = userEvent.setup();
    const { props } = renderSection({
      candidates: [candidate('c1', 'N26')],
      loadError: new AppError(
        'Failed to load import candidates',
        APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
      ),
    });

    expect(screen.getByRole('list', { name: 'Candidates to review' })).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer at N26')).toBeInTheDocument();
    // A plain notice, not a live region, since it holds the Try again button.
    expect(screen.getByText('Failed to load import candidates')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(props.reload).toHaveBeenCalledOnce();
  });
});
