import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import {
  Component as ProfileRoute,
  ProfileRouteComingSoon,
  ProfileRouteWithProfiles,
} from './profileRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('profileRoute', () => {
  it('uses the variant with profiles while the feature is on, as it is under test', () => {
    expect(ProfileRoute).toBe(ProfileRouteWithProfiles);
  });

  it('loads the resume profiles', async () => {
    renderWithProviders(<ProfileRoute />);

    expect(await screen.findByText('No resume profiles yet')).toBeInTheDocument();
  });

  it('keeps the coming soon placeholder, making no request, while the feature is off', () => {
    renderWithProviders(<ProfileRouteComingSoon />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
