import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { DiscoverPage } from './DiscoverPage';
import { AppError } from '../../errors';
import { renderWithProviders } from '../../test/renderWithProviders';
import { APP_ERROR_CODES } from '../../types';
import type { TSavedSearchResponse, TSaveSavedSearchRequest } from '../../services';

const search: TSavedSearchResponse = {
  createdAt: '2026-10-01T09:00:00Z',
  criteria: {
    location: 'Berlin',
    name: 'Senior backend in Berlin',
    notes: 'Payments teams preferred.',
    role: 'Backend Engineer',
    seniority: ['SENIOR'],
    skills: ['Kotlin', 'PostgreSQL'],
    workModes: ['HYBRID'],
  },
  id: 'search-1',
  updatedAt: '2026-10-01T09:00:00Z',
};

const renderPage = (overrides: Partial<ComponentProps<typeof DiscoverPage>> = {}) => {
  const props: ComponentProps<typeof DiscoverPage> = {
    createSearch: vi.fn(async (payload: TSaveSavedSearchRequest) => ({
      ...search,
      ...payload,
      id: 'new',
    })),
    deleteSearch: vi.fn(async () => {}),
    isLoading: false,
    isMutating: false,
    loadError: null,
    mutationError: null,
    reload: vi.fn(),
    searches: [search],
    updateSearch: vi.fn(async (_id: string, payload: TSaveSavedSearchRequest) => ({
      ...search,
      ...payload,
    })),
    ...overrides,
  };

  return { ...renderWithProviders(<DiscoverPage {...props} />), props };
};

describe('DiscoverPage', () => {
  it('renders saved searches with their role, location, and criteria', () => {
    renderPage();

    const card = screen
      .getByRole('heading', { name: 'Senior backend in Berlin' })
      .closest('li') as HTMLElement;

    expect(within(card).getByText('Backend Engineer · Berlin')).toBeInTheDocument();
    expect(within(card).getByText('Senior · Hybrid')).toBeInTheDocument();
    expect(
      within(card).getByRole('list', { name: 'Skills for Senior backend in Berlin' }),
    ).toHaveTextContent('KotlinPostgreSQL');
    expect(within(card).getByText('Payments teams preferred.')).toBeInTheDocument();
  });

  it('explains saved searches when there are none', () => {
    renderPage({ searches: [] });

    const region = screen.getByRole('region', { name: 'Saved searches' });

    expect(within(region).getByText('No saved searches yet')).toBeInTheDocument();
    expect(
      within(region).getByText(/so later import and discovery can start from them/),
    ).toBeInTheDocument();
  });

  it('creates a search with normalized criteria', async () => {
    const user = userEvent.setup();
    const { props } = renderPage({ searches: [] });

    await user.click(screen.getByRole('button', { name: 'New search' }));

    expect(screen.getByRole('button', { name: 'Save search' })).toBeDisabled();

    await user.type(screen.getByLabelText('Search name'), '  Remote   frontend ');
    await user.type(screen.getByLabelText('Role'), 'Frontend Engineer');
    await user.click(screen.getByRole('checkbox', { name: 'Remote' }));
    await user.click(screen.getByRole('checkbox', { name: 'Mid-level' }));
    await user.type(screen.getByLabelText('Skills'), 'react{Enter}React{Enter}');
    expect(screen.getByLabelText('Skills')).toHaveValue('React');
    expect(screen.getByText('Already in the list.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Skills'));
    await user.type(screen.getByLabelText('Skills'), 'TypeScript{Enter}');
    await user.click(screen.getByRole('button', { name: 'Save search' }));

    expect(props.createSearch).toHaveBeenCalledWith({
      criteria: {
        location: '',
        name: 'Remote frontend',
        notes: '',
        role: 'Frontend Engineer',
        seniority: ['MID'],
        skills: ['react', 'TypeScript'],
        workModes: ['REMOTE'],
      },
    });
    expect(await screen.findByRole('button', { name: 'New search' })).toBeInTheDocument();
  });

  it('edits a search in place', async () => {
    const user = userEvent.setup();
    const { props } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit search Senior backend in Berlin' }));

    expect(screen.getByLabelText('Location')).toHaveValue('Berlin');

    await user.clear(screen.getByLabelText('Location'));
    await user.type(screen.getByLabelText('Location'), 'Munich');
    await user.click(screen.getByRole('button', { name: 'Remove Kotlin' }));
    await user.click(screen.getByRole('button', { name: 'Save search' }));

    expect(props.updateSearch).toHaveBeenCalledWith('search-1', {
      criteria: { ...search.criteria, location: 'Munich', skills: ['PostgreSQL'] },
    });
  });

  it('keeps the editor open with the entered values when saving fails', async () => {
    const user = userEvent.setup();
    renderPage({
      updateSearch: vi.fn(async () =>
        Promise.reject(new AppError('Failed', APP_ERROR_CODES.SAVED_SEARCH_REQUEST_FAILED)),
      ),
    });

    await user.click(screen.getByRole('button', { name: 'Edit search Senior backend in Berlin' }));
    await user.type(screen.getByLabelText('Notes'), ' Urgent.');
    await user.click(screen.getByRole('button', { name: 'Save search' }));

    expect(screen.getByLabelText('Notes')).toHaveValue('Payments teams preferred. Urgent.');
  });

  it('deletes a search and cancels an edit', async () => {
    const user = userEvent.setup();
    const { props } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit search Senior backend in Berlin' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(
      screen.getByRole('button', { name: 'Delete search Senior backend in Berlin' }),
    );

    expect(props.updateSearch).not.toHaveBeenCalled();
    expect(props.deleteSearch).toHaveBeenCalledWith('search-1');
  });

  it('shows a write error, loading, and a retryable load error', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPage({
      mutationError: new AppError(
        'Failed to delete saved search',
        APP_ERROR_CODES.SAVED_SEARCH_REQUEST_FAILED,
      ),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to delete saved search');
    unmount();

    const loading = renderPage({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading saved searches');
    loading.unmount();

    const { props } = renderPage({
      loadError: new AppError('Failed', APP_ERROR_CODES.SAVED_SEARCH_REQUEST_FAILED),
    });

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(props.reload).toHaveBeenCalledOnce();
  });
});
