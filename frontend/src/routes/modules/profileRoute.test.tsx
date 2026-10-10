import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import {
  Component as ProfileRoute,
  ProfileRouteComingSoon,
  ProfileRouteSections,
  ProfileRouteWithSections,
} from './profileRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

const PREFERENCES_REGION = { name: 'Skills and job preferences' };

describe('profileRoute', () => {
  it('uses the sections while the features are on, as they are under test', () => {
    expect(ProfileRoute).toBe(ProfileRouteWithSections);
  });

  it('loads the resume profiles', async () => {
    renderWithProviders(<ProfileRoute />);

    expect(await screen.findByText('No resume profiles yet')).toBeInTheDocument();
  });

  it('shows the skills and preferences section below the profiles', async () => {
    renderWithProviders(<ProfileRoute />);

    expect(await screen.findByRole('region', PREFERENCES_REGION)).toBeInTheDocument();
    expect(await screen.findByText('Not saved yet')).toBeInTheDocument();
  });

  it('shows the preferences section on its own when only its feature is on', async () => {
    renderWithProviders(<ProfileRouteSections showLibrary={false} showPreferences />);

    expect(await screen.findByRole('region', PREFERENCES_REGION)).toBeInTheDocument();
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
