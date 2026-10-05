import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ImportCandidatesSection } from './ImportCandidatesSection';
import { AppError } from '../../../errors';
import { renderWithProviders } from '../../../test/renderWithProviders';
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
    createCandidate: vi.fn(async (payload: TSaveImportCandidateRequest) => ({
      ...candidate('c3', payload.content.company),
      ...payload,
    })),
    deleteCandidate: vi.fn(async () => {}),
    isLoading: false,
    isMutating: false,
    loadError: null,
    mutationError: null,
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
    expect(
      within(list).getAllByText(
        'Berlin · Entered manually · Waiting for review · Duplicates not checked',
      ),
    ).toHaveLength(2);
  });

  it('selects candidates one by one, all at once, and clears the selection', async () => {
    const user = userEvent.setup();
    renderSection();

    expect(screen.getByText('0 of 2 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'Select Backend Engineer at N26' }));
    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Select Backend Engineer at Zalando' }),
    ).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
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

    expect(screen.getByText('Link must start with http:// or https://')).toBeInTheDocument();
    expect(props.createCandidate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Company')).toHaveValue('Personio');
  });

  it('keeps the draft and shows the error when saving fails', async () => {
    const user = userEvent.setup();
    renderSection({
      createCandidate: vi.fn(async () => Promise.reject(new Error('x'))),
      mutationError: new AppError(
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
});
