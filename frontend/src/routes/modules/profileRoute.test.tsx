import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import {
  Component as ProfileRoute,
  ProfileRouteComingSoon,
  ProfileRouteSections,
  ProfileRouteWithSections,
} from './profileRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

const PREFERENCES_REGION = { name: 'Job preferences' };

describe('profileRoute', () => {
  it('uses the sections while the features are on, as they are under test', () => {
    expect(ProfileRoute).toBe(ProfileRouteWithSections);
  });

  it('loads the resume profiles', async () => {
    renderWithProviders(<ProfileRoute />);

    expect(await screen.findByText('No resume profiles yet')).toBeInTheDocument();
  });

  it('shows the sample account summary, marked as sample data', () => {
    renderWithProviders(<ProfileRoute />);

    const account = screen.getByRole('region', { name: 'Account summary' });

    expect(within(account).getByRole('heading', { name: 'Jordan Davis' })).toBeInTheDocument();
    expect(account).toHaveTextContent('Sample data');
  });

  it('puts the library and Skills side by side, Job preferences below, from xl', async () => {
    const { container } = renderWithProviders(<ProfileRoute />);

    expect(await screen.findByRole('region', PREFERENCES_REGION)).toHaveClass('col-span-full');
    expect(await screen.findByText('Not saved yet')).toBeInTheDocument();

    const grid = container.querySelector('.xl\\:grid-cols-2') as HTMLElement;

    // One column while the profile editor (`data-editor`) is open.
    expect(grid).toHaveClass('xl:has-[[data-editor]]:grid-cols-1');
    expect(within(grid).getByRole('region', { name: 'Resume library' })).toBeInTheDocument();
    expect(within(grid).getByRole('region', { name: 'Skills' })).toBeInTheDocument();
  });

  it('shows the preferences section on its own when only its feature is on', async () => {
    const { container } = renderWithProviders(
      <ProfileRouteSections showLibrary={false} showPreferences />,
    );

    expect(await screen.findByRole('region', PREFERENCES_REGION)).toHaveClass('col-span-full');
    expect(container.querySelector('.xl\\:grid-cols-2')).toBeNull();
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
    expect(screen.queryByText('No resume profiles yet')).not.toBeInTheDocument();
  });

  it('shows the resume profiles on their own when only their feature is on', async () => {
    renderWithProviders(<ProfileRouteSections showLibrary showPreferences={false} />);

    expect(await screen.findByText('No resume profiles yet')).toBeInTheDocument();
    expect(screen.queryByRole('region', PREFERENCES_REGION)).not.toBeInTheDocument();
  });

  it('keeps the coming soon placeholder, making no request, while both features are off', () => {
    renderWithProviders(<ProfileRouteComingSoon />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
