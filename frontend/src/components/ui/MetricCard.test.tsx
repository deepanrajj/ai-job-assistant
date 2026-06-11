import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('renders a metric label and value', () => {
    render(<MetricCard label="Active pipeline" tone="success" value={7} />);

    expect(screen.getByText('Active pipeline')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
