import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ProfilePreferencesSection } from './ProfilePreferencesSection';
import { AppError } from '../../../errors';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { APP_ERROR_CODES } from '../../../types';
import type { TProfilePreferences, TProfilePreferencesResponse } from '../../../services';

const saved: TProfilePreferencesResponse = {
  keywords: ['payments'],
  locations: ['Berlin'],
  roles: ['Backend Engineer'],
  seniority: ['SENIOR'],
  skills: ['Kotlin', 'React'],
  updatedAt: '2026-10-04T09:00:00Z',
  workModes: ['REMOTE'],
};

const empty: TProfilePreferencesResponse = {
  keywords: [],
  locations: [],
  roles: [],
  seniority: [],
  skills: [],
  updatedAt: null,
  workModes: [],
};

const renderSection = (
  overrides: Partial<ComponentProps<typeof ProfilePreferencesSection>> = {},
) => {
  const props: ComponentProps<typeof ProfilePreferencesSection> = {
    isLoading: false,
    isSaving: false,
    loadError: null,
    preferences: saved,
    reload: vi.fn(),
    save: vi.fn(async () => {}),
    saveError: null,
    ...overrides,
  };

  return { ...renderWithProviders(<ProfilePreferencesSection {...props} />), props };
};

const savedPayload = (save: ComponentProps<typeof ProfilePreferencesSection>['save']) =>
  vi.mocked(save).mock.calls[0]?.[0] as TProfilePreferences;

describe('ProfilePreferencesSection', () => {
  it('displays the saved preferences', () => {
    renderSection();

    expect(
      within(screen.getByRole('list', { name: 'Skills added' })).getAllByRole('listitem'),
    ).toHaveLength(2);
    expect(screen.getByRole('list', { name: 'Target roles added' })).toHaveTextContent(
      'Backend Engineer',
    );
    expect(screen.getByRole('checkbox', { name: 'Remote' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Hybrid' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Senior' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('renders an empty record cleanly', () => {
    renderSection({ preferences: empty });

    expect(screen.getByRole('region', { name: 'Skills and job preferences' })).toBeInTheDocument();
    expect(screen.getAllByText('None yet')).toHaveLength(4);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Not saved yet');
  });

  it('adds skills by button and by Enter, ignores a duplicate, and removes one', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.type(screen.getByLabelText('Skills'), '  Spring   Boot ');
    await user.click(screen.getByRole('button', { name: 'Add to Skills' }));
    await user.type(screen.getByLabelText('Skills'), 'kotlin{Enter}');
    await user.type(screen.getByLabelText('Skills'), 'PostgreSQL{Enter}');
    await user.click(screen.getByRole('button', { name: 'Remove React' }));

    expect(screen.getByLabelText('Skills')).toHaveValue('');
    expect(
      within(screen.getByRole('list', { name: 'Skills added' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent?.replace('×', '')),
    ).toEqual(['Kotlin', 'Spring Boot', 'PostgreSQL']);

    await user.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(savedPayload(props.save).skills).toEqual(['Kotlin', 'Spring Boot', 'PostgreSQL']);
  });

  it('does not submit the form when Enter adds a value', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.type(screen.getByLabelText('Keywords'), 'fintech{Enter}');

    expect(props.save).not.toHaveBeenCalled();
  });

  it('saves work mode and seniority changes with the other lists', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.click(screen.getByRole('checkbox', { name: 'Hybrid' }));
    await user.click(screen.getByRole('checkbox', { name: 'Remote' }));
    await user.click(screen.getByRole('checkbox', { name: 'Lead' }));
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(savedPayload(props.save)).toEqual({
      keywords: ['payments'],
      locations: ['Berlin'],
      roles: ['Backend Engineer'],
      seniority: ['SENIOR', 'LEAD'],
      skills: ['Kotlin', 'React'],
      workModes: ['HYBRID'],
    });
  });

  it('keeps the edits and shows the error when saving fails', async () => {
    const user = userEvent.setup();
    renderSection({
      save: vi.fn(async () => Promise.reject(new Error('x'))),
      saveError: new AppError(
        'Failed to save skills and preferences',
        APP_ERROR_CODES.PREFERENCES_REQUEST_FAILED,
      ),
    });

    await user.type(screen.getByLabelText('Locations'), 'Munich{Enter}');
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save skills and preferences');
    expect(screen.getByRole('list', { name: 'Locations added' })).toHaveTextContent('Munich');
  });

  it('shows loading and a retryable load error', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSection({ isLoading: true, preferences: null });

    expect(screen.getByRole('status')).toHaveTextContent('Loading skills and preferences');
    unmount();

    const { props } = renderSection({
      loadError: new AppError('Failed', APP_ERROR_CODES.PREFERENCES_REQUEST_FAILED),
      preferences: null,
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Skills and preferences could not be loaded',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(props.reload).toHaveBeenCalledOnce();
  });
});
