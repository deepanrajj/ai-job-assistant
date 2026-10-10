import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ProfilePage } from './ProfilePage';
import { AppError } from '../../errors';
import { renderWithProviders } from '../../test/renderWithProviders';
import { APP_ERROR_CODES } from '../../types';
import type { TResumeProfileResponse, TSaveResumeProfileRequest } from '../../services';

const baseProfile: TResumeProfileResponse = {
  createdAt: '2026-10-01T09:00:00Z',
  id: 'profile-1',
  name: 'Base profile',
  profile: {
    education: [{ id: 'edu-1', text: 'BSc Computer Science' }],
    highlights: [
      { id: 'hl-1', text: 'Led the payments migration.' },
      { id: 'hl-2', text: 'Built a design system.' },
    ],
    links: [{ id: 'link-1', label: 'GitHub', url: 'https://github.com/example' }],
    notes: '',
    summary: 'Full-stack engineer.',
    targetRole: 'BASE',
  },
  updatedAt: '2026-10-01T09:00:00Z',
};

const renderPage = (overrides: Partial<ComponentProps<typeof ProfilePage>> = {}) => {
  const props: ComponentProps<typeof ProfilePage> = {
    clearMutationError: vi.fn(),
    createProfile: vi.fn(async (payload: TSaveResumeProfileRequest) => ({
      ...baseProfile,
      ...payload,
      id: 'profile-new',
    })),
    deleteProfile: vi.fn(async () => {}),
    isLoading: false,
    isMutating: false,
    loadError: null,
    mutationError: null,
    profiles: [baseProfile],
    reload: vi.fn(),
    updateProfile: vi.fn(async (_id: string, payload: TSaveResumeProfileRequest) => ({
      ...baseProfile,
      ...payload,
    })),
    ...overrides,
  };

  return { ...renderWithProviders(<ProfilePage {...props} />), props };
};

describe('ProfilePage', () => {
  it('lists saved profiles with their role, summary, and entry counts', () => {
    renderPage();

    const card = screen.getByRole('heading', { name: 'Base profile' }).closest('li') as HTMLElement;

    expect(within(card).getByText('Base')).toBeInTheDocument();
    expect(within(card).getByText('Full-stack engineer.')).toBeInTheDocument();
    expect(within(card).getByText('Highlights: 2 · Education: 1 · Links: 1')).toBeInTheDocument();
  });

  it('shows an empty state inside the labelled Resume profiles region', () => {
    renderPage({ profiles: [] });

    const region = screen.getByRole('region', { name: 'Resume profiles' });

    expect(within(region).getByText('No resume profiles yet')).toBeInTheDocument();
  });

  it('creates a profile with entries, each given its own id', async () => {
    const user = userEvent.setup();
    const { props } = renderPage({ profiles: [] });

    await user.click(screen.getByRole('button', { name: 'New profile' }));
    await user.type(screen.getByLabelText('Profile name'), 'Backend profile');
    await user.selectOptions(screen.getByLabelText('Target role'), 'BACKEND');
    await user.click(screen.getByRole('button', { name: 'Add highlight' }));
    await user.type(screen.getByLabelText('Highlight 1'), '  Scaled the payments API  ');
    await user.click(screen.getByRole('button', { name: 'Add highlight' }));
    await user.type(screen.getByLabelText('Highlight 2'), 'Mentored two engineers');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(props.createProfile).toHaveBeenCalledOnce();

    const payload = vi.mocked(props.createProfile).mock.calls[0]?.[0] as TSaveResumeProfileRequest;
    const ids = payload.profile.highlights.map((entry) => entry.id);

    expect(payload.name).toBe('Backend profile');
    expect(payload.profile.targetRole).toBe('BACKEND');
    expect(payload.profile.highlights.map((entry) => entry.text)).toEqual([
      'Scaled the payments API',
      'Mentored two engineers',
    ]);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every(Boolean)).toBe(true);
    expect(await screen.findByRole('button', { name: 'New profile' })).toBeInTheDocument();
  });

  it('keeps entry ids when entries are edited and reordered, and saves the new order', async () => {
    const user = userEvent.setup();
    const { props } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit profile Base profile' }));
    await user.clear(screen.getByLabelText('Highlight 1'));
    await user.type(screen.getByLabelText('Highlight 1'), 'Led the payments migration to Kotlin.');
    await user.click(screen.getByRole('button', { name: 'Move Highlight 1 down' }));
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    const [id, payload] = vi.mocked(props.updateProfile).mock.calls[0] ?? [];

    expect(id).toBe('profile-1');
    expect(payload?.profile.highlights).toEqual([
      { id: 'hl-2', text: 'Built a design system.' },
      { id: 'hl-1', text: 'Led the payments migration to Kotlin.' },
    ]);
    expect(payload?.profile.education).toEqual(baseProfile.profile.education);
    expect(payload?.profile.links).toEqual(baseProfile.profile.links);
  });

  it('disables moving the first entry up and the last one down', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit profile Base profile' }));

    expect(screen.getByRole('button', { name: 'Move Highlight 1 up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Highlight 2 down' })).toBeDisabled();
  });

  it('removes an entry and blocks saving a link that is not http(s)', async () => {
    const user = userEvent.setup();
    const { props } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit profile Base profile' }));
    await user.click(screen.getByRole('button', { name: 'Remove Education 1' }));
    await user.clear(screen.getByLabelText('Link 1 URL'));
    await user.type(screen.getByLabelText('Link 1 URL'), 'javascript:alert(1)');

    expect(screen.getByText('URL must start with http:// or https://')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
    expect(screen.queryByLabelText('Education 1')).not.toBeInTheDocument();
    expect(props.updateProfile).not.toHaveBeenCalled();
  });

  it('keeps the editor open with the entered values when saving fails', async () => {
    const user = userEvent.setup();
    const failure = new AppError(
      'Failed to save resume profile',
      APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
    );
    renderPage({ updateProfile: vi.fn(async () => Promise.reject(failure)) });

    await user.click(screen.getByRole('button', { name: 'Edit profile Base profile' }));
    await user.clear(screen.getByLabelText('Profile name'));
    await user.type(screen.getByLabelText('Profile name'), 'Renamed');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(screen.getByLabelText('Profile name')).toHaveValue('Renamed');
  });

  it('discards edits on cancel', async () => {
    const user = userEvent.setup();
    const { props } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit profile Base profile' }));
    await user.type(screen.getByLabelText('Profile name'), ' changed');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('heading', { name: 'Base profile' })).toBeInTheDocument();
    expect(props.updateProfile).not.toHaveBeenCalled();
  });

  it('deletes a profile', async () => {
    const user = userEvent.setup();
    const { props } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete profile Base profile' }));

    expect(props.deleteProfile).toHaveBeenCalledWith('profile-1');
  });

  it('shows a write error above the list', () => {
    renderPage({
      mutationError: new AppError(
        'Failed to delete resume profile',
        APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
      ),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to delete resume profile');
  });

  it('clears a write error when the editor opens and when it closes', async () => {
    const user = userEvent.setup();
    const { props } = renderPage();

    await user.click(screen.getByRole('button', { name: 'New profile' }));

    expect(props.clearMutationError).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.clearMutationError).toHaveBeenCalledTimes(2);
  });

  it('says why a profile cannot be saved: a missing name or half a link', async () => {
    const user = userEvent.setup();
    renderPage({ profiles: [] });

    await user.click(screen.getByRole('button', { name: 'New profile' }));

    expect(screen.queryByText('Required')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Profile name'));
    await user.tab();

    expect(screen.getByLabelText('Profile name')).toHaveAccessibleDescription('Required');

    await user.type(screen.getByLabelText('Profile name'), 'Base');
    await user.click(screen.getByRole('button', { name: 'Add link' }));

    expect(screen.queryByText('Required')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled();

    await user.type(screen.getByLabelText('Link 1 URL'), 'https://github.com/example');

    expect(screen.getByLabelText('Link 1 label')).toHaveAccessibleDescription('Required');
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();

    await user.clear(screen.getByLabelText('Link 1 URL'));
    await user.type(screen.getByLabelText('Link 1 label'), 'GitHub');

    expect(screen.getByLabelText('Link 1 URL')).toHaveAccessibleDescription('Required');
  });

  it('drops entries and links left empty when saving', async () => {
    const user = userEvent.setup();
    const { props } = renderPage({ profiles: [] });

    await user.click(screen.getByRole('button', { name: 'New profile' }));
    await user.type(screen.getByLabelText('Profile name'), 'Base');
    await user.click(screen.getByRole('button', { name: 'Add highlight' }));
    await user.type(screen.getByLabelText('Highlight 1'), '   ');
    await user.click(screen.getByRole('button', { name: 'Add education' }));
    await user.click(screen.getByRole('button', { name: 'Add link' }));
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    const payload = vi.mocked(props.createProfile).mock.calls[0]?.[0] as TSaveResumeProfileRequest;

    expect(payload.profile).toMatchObject({ education: [], highlights: [], links: [] });
  });

  it('shows loading and a retryable load error', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPage({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading resume profiles');
    unmount();

    const { props } = renderPage({
      loadError: new AppError(
        'Failed to load resume profiles',
        APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
      ),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Resume profiles could not be loaded');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(props.reload).toHaveBeenCalledOnce();
  });
});
