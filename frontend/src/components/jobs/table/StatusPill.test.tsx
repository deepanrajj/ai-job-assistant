import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it('renders a localized job status label', () => {
    renderWithProviders(<StatusPill status="INTERVIEW" />);

    expect(screen.getByText('Interview')).toBeInTheDocument();
  });
});
