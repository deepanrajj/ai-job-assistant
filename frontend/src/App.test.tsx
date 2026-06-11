import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();

  return {
    ...actual,
    RouterProvider: () => <div>Router mounted</div>,
  };
});

vi.mock('./routes/router', () => ({
  appRouter: {},
}));

import App from './App';

describe('App', () => {
  it('mounts the configured router provider', () => {
    render(<App />);

    expect(screen.getByText('Router mounted')).toBeInTheDocument();
  });
});
