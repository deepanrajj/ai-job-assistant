import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { SectionCard } from './SectionCard';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('SectionCard', () => {
  it('renders a titled card section around children', () => {
    renderWithProviders(
      <SectionCard title="Preparation Tasks">
        <p>Review the job requirements.</p>
      </SectionCard>,
    );

    expect(screen.getByRole('heading', { name: 'Preparation Tasks' })).toBeInTheDocument();
    expect(screen.getByText('Review the job requirements.')).toBeInTheDocument();
  });
});
