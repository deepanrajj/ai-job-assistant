import { describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
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
    clearSaveError: vi.fn(),
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

const editSkills = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Edit skills' }));

const editPreferences = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Edit preferences' }));

const savedPayload = (save: ComponentProps<typeof ProfilePreferencesSection>['save']) =>
  vi.mocked(save).mock.calls[0]?.[0] as TProfilePreferences;

/**
 * Returns the value shown under a label in the Job preferences card.
 */
const preferenceValue = (label: string): HTMLElement =>
  within(screen.getByRole('region', { name: 'Job preferences' })).getByText(label)
    .nextElementSibling as HTMLElement;

describe('ProfilePreferencesSection', () => {
  it('shows the saved skills and preferences, read only', () => {
    renderSection();

    const skills = screen.getByRole('region', { name: 'Skills' });

    expect(
      within(skills)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Kotlin', 'React']);
    expect(preferenceValue('Target roles')).toHaveTextContent('Backend Engineer');
    expect(preferenceValue('Work mode')).toHaveTextContent('Remote');
    expect(preferenceValue('Seniority')).toHaveTextContent('Senior');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('renders an empty record cleanly', () => {
    renderSection({ preferences: empty });

    expect(screen.getAllByText('None yet')).toHaveLength(6);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Not saved yet');
  });

  it('adds skills by button and by Enter, removes one, and saves the whole record', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await editSkills(user);
    await user.type(screen.getByRole('textbox', { name: 'Skills' }), '  Spring   Boot ');
    await user.click(screen.getByRole('button', { name: 'Add to Skills' }));
    await user.type(screen.getByRole('textbox', { name: 'Skills' }), 'PostgreSQL{Enter}');
    await user.click(screen.getByRole('button', { name: 'Remove React' }));

    expect(screen.getByRole('textbox', { name: 'Skills' })).toHaveValue('');
    expect(
      within(screen.getByRole('list', { name: 'Skills added' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent?.replace('×', '')),
    ).toEqual(['Kotlin', 'Spring Boot', 'PostgreSQL']);

    await user.click(screen.getByRole('button', { name: 'Save skills' }));

    expect(savedPayload(props.save)).toEqual({
      keywords: ['payments'],
      locations: ['Berlin'],
      roles: ['Backend Engineer'],
      seniority: ['SENIOR'],
      skills: ['Kotlin', 'Spring Boot', 'PostgreSQL'],
      workModes: ['REMOTE'],
    });
  });

  it('keeps a value it cannot add in the input, saying why', async () => {
    const user = userEvent.setup();
    renderSection();

    await editSkills(user);
    const skills = screen.getByRole('textbox', { name: 'Skills' });

    await user.type(skills, 'kotlin{Enter}');

    expect(skills).toHaveValue('kotlin');
    expect(skills).toHaveAccessibleDescription('Already in the list.');
    expect(screen.getByRole('button', { name: 'Add to Skills' })).toBeDisabled();

    await user.clear(skills);
    await user.type(skills, 'x'.repeat(61));
    await user.click(screen.getByRole('button', { name: 'Add to Skills' }));

    expect(skills).toHaveValue('x'.repeat(61));
    expect(skills).toHaveAccessibleDescription('Use at most 60 characters.');
  });

  it('says when a list is full and refuses another value', async () => {
    const user = userEvent.setup();
    const full = Array.from({ length: 50 }, (_, index) => `Skill ${index}`);
    renderSection({ preferences: { ...saved, skills: full } });

    await editSkills(user);
    const skills = screen.getByRole('textbox', { name: 'Skills' });

    expect(skills).toHaveAccessibleDescription(
      'This list is full (50). Remove one to add another.',
    );

    await user.type(skills, 'One more{Enter}');

    expect(skills).toHaveValue('One more');
    expect(
      within(screen.getByRole('list', { name: 'Skills added' })).getAllByRole('listitem'),
    ).toHaveLength(50);
  });

  it('saves text typed into a list but not added', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await editPreferences(user);
    await user.type(screen.getByLabelText('Locations'), ' Munich ');
    await user.type(screen.getByLabelText('Keywords'), 'fintech');
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(savedPayload(props.save)).toMatchObject({
      keywords: ['payments', 'fintech'],
      locations: ['Berlin', 'Munich'],
      skills: ['Kotlin', 'React'],
    });
  });

  it('does not save while typed text cannot be added', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await editPreferences(user);
    await user.type(screen.getByLabelText('Target roles'), 'backend engineer');
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(props.save).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Target roles')).toHaveFocus();
    expect(screen.getByLabelText('Target roles')).toHaveAccessibleDescription(
      'Already in the list.',
    );
  });

  it('closes the editor on save, returns focus to its edit button, and announces the save', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();
    const status = screen.getByRole('status');

    await editSkills(user);
    await user.click(screen.getByRole('button', { name: 'Save skills' }));

    expect(props.save).toHaveBeenCalledOnce();
    expect(screen.queryByRole('textbox', { name: 'Skills' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit skills' })).toHaveFocus();
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('Skills and preferences saved');
  });

  it('discards edits on cancel and returns focus to the edit button', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await editPreferences(user);
    await user.type(screen.getByLabelText('Locations'), 'Munich{Enter}');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.save).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit preferences' })).toHaveFocus();
    expect(screen.queryByText(/Munich/)).not.toBeInTheDocument();
  });

  it('edits one card at a time', async () => {
    const user = userEvent.setup();
    renderSection();

    await editSkills(user);

    expect(screen.getByRole('button', { name: 'Edit preferences' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: 'Edit preferences' })).toBeEnabled();
  });

  it('says it is saving while a save is in flight', () => {
    renderSection({ isSaving: true });

    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  });

  it('returns focus to the input after adding, and to a neighbour after removing', async () => {
    const user = userEvent.setup();
    renderSection();

    await editSkills(user);
    await user.type(screen.getByRole('textbox', { name: 'Skills' }), 'Go');
    await user.click(screen.getByRole('button', { name: 'Add to Skills' }));

    expect(screen.getByRole('textbox', { name: 'Skills' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Remove React' }));

    expect(screen.getByRole('button', { name: 'Remove Go' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Remove Go' }));

    expect(screen.getByRole('button', { name: 'Remove Kotlin' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Remove Kotlin' }));

    expect(screen.getByRole('textbox', { name: 'Skills' })).toHaveFocus();
  });

  it('keeps stored values it would not accept today when saving other changes', async () => {
    const user = userEvent.setup();
    const long = 'x'.repeat(70);
    const { props } = renderSection({
      preferences: {
        ...saved,
        skills: [long],
        workModes: ['REMOTE', 'CARAVAN' as TProfilePreferences['workModes'][number]],
      },
    });

    // An unknown stored value is shown as it is.
    expect(preferenceValue('Work mode')).toHaveTextContent('Remote, CARAVAN');

    await editPreferences(user);
    await user.click(screen.getByRole('checkbox', { name: 'Hybrid' }));
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(savedPayload(props.save)).toMatchObject({
      skills: [long],
      workModes: ['REMOTE', 'HYBRID', 'CARAVAN'],
    });
  });

  it('keeps a stored over-long value when a value is added, by Add or by Save', async () => {
    const user = userEvent.setup();
    const long = 'x'.repeat(70);
    const { props } = renderSection({ preferences: { ...saved, skills: [long] } });

    await editSkills(user);
    await user.type(screen.getByRole('textbox', { name: 'Skills' }), 'Go{Enter}');
    await user.type(screen.getByRole('textbox', { name: 'Skills' }), 'Rust');
    await user.click(screen.getByRole('button', { name: 'Save skills' }));

    expect(savedPayload(props.save)).toMatchObject({ skills: [long, 'Go', 'Rust'] });
  });

  it('does not submit the form when Enter adds a value', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await editPreferences(user);
    await user.type(screen.getByLabelText('Keywords'), 'fintech{Enter}');

    expect(props.save).not.toHaveBeenCalled();
  });

  it('saves work mode and seniority changes with the other lists', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await editPreferences(user);
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

  it('keeps the editor open with the edits and shows the error when saving fails', async () => {
    const user = userEvent.setup();
    renderSection({
      save: vi.fn(async () => Promise.reject(new Error('x'))),
      saveError: new AppError(
        'Failed to save skills and preferences',
        APP_ERROR_CODES.PREFERENCES_REQUEST_FAILED,
      ),
    });

    await editPreferences(user);
    await user.type(screen.getByLabelText('Locations'), 'Munich{Enter}');
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save skills and preferences');
    expect(screen.getByRole('list', { name: 'Locations added' })).toHaveTextContent('Munich');
    expect(screen.getByRole('button', { name: 'Save preferences' })).toBeInTheDocument();
  });

  it('shows loading and a retryable load error once, in one card', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSection({ isLoading: true, preferences: null });

    expect(screen.getByRole('region', { name: 'Skills and job preferences' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading skills and preferences');
    expect(screen.queryByRole('region', { name: 'Skills' })).not.toBeInTheDocument();
    unmount();

    const { props } = renderSection({
      loadError: new AppError('Failed', APP_ERROR_CODES.PREFERENCES_REQUEST_FAILED),
      preferences: null,
    });

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Skills and preferences could not be loaded',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(props.reload).toHaveBeenCalledOnce();
  });

  it('spans the job preferences across the whole row of any grid', () => {
    renderSection();

    expect(screen.getByRole('region', { name: 'Job preferences' })).toHaveClass('col-span-full');
  });

  it('clears a save error when an editor opens and when it closes', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await editSkills(user);

    expect(props.clearSaveError).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.clearSaveError).toHaveBeenCalledTimes(2);
  });

  it('does not say "saved" after a later save fails', async () => {
    const user = userEvent.setup();
    const save = vi
      .fn<(preferences: TProfilePreferences) => Promise<void>>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('x'));
    renderSection({ save });

    await editSkills(user);
    await user.click(screen.getByRole('button', { name: 'Save skills' }));

    expect(screen.getByRole('status')).toHaveTextContent('Skills and preferences saved');

    await editPreferences(user);
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(save).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('Saved Oct 4, 2026');
  });

  it('returns focus to the edit button once the save in flight has finished', async () => {
    const user = userEvent.setup();
    let finishSave: () => void = () => {};
    const save = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        }),
    );
    const { props, rerender } = renderSection({ save });

    await editSkills(user);
    await user.click(screen.getByRole('button', { name: 'Save skills' }));
    // The save resolves while the request still reads as in flight, so the
    // edit button is disabled when the editor closes.
    rerender(<ProfilePreferencesSection {...props} isSaving />);
    await act(async () => finishSave());

    expect(screen.getByRole('button', { name: 'Edit skills' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit skills' })).not.toHaveFocus();

    rerender(<ProfilePreferencesSection {...props} isSaving={false} />);

    expect(screen.getByRole('button', { name: 'Edit skills' })).toHaveFocus();
  });

  it('leaves focus where the user put it while the save was still in flight', async () => {
    const user = userEvent.setup();
    let finishSave: () => void = () => {};
    const save = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        }),
    );
    const { props, rerender } = renderSection({ save });

    await editSkills(user);
    await user.click(screen.getByRole('button', { name: 'Save skills' }));
    rerender(<ProfilePreferencesSection {...props} isSaving />);
    await act(async () => finishSave());
    // The user moves on before the save reads as finished.
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    rerender(<ProfilePreferencesSection {...props} isSaving={false} />);

    expect(outside).toHaveFocus();
    outside.remove();
  });

  it('shows a stored value named like a built-in object property as it is', () => {
    renderSection({
      preferences: {
        ...saved,
        seniority: ['constructor' as TProfilePreferences['seniority'][number]],
        workModes: ['toString' as TProfilePreferences['workModes'][number]],
      },
    });

    expect(preferenceValue('Work mode')).toHaveTextContent('toString');
    expect(preferenceValue('Seniority')).toHaveTextContent('constructor');
  });
});
