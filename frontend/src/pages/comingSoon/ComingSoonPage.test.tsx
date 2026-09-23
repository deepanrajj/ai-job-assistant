import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { ComingSoonPage } from './ComingSoonPage';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('ComingSoonPage', () => {
  it('renders the given title and description', () => {
    renderWithProviders(
      <ComingSoonPage description="Check back in a future update." title="Coming soon" />,
    );

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.getByText('Check back in a future update.')).toBeInTheDocument();
  });
});
