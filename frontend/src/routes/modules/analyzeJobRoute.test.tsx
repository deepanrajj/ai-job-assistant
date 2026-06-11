import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../test/renderWithProviders';
import { Component as AnalyzeJobRoute } from './analyzeJobRoute';

describe('analyzeJobRoute', () => {
  it('renders AI assistant route content', () => {
    renderWithProviders(<AnalyzeJobRoute />);

    expect(screen.getByRole('heading', { name: 'Job Description Input' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI Analysis' })).toBeInTheDocument();
  });
});
