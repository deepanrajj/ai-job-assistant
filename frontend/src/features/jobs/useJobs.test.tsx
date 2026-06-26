import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { JobsProvider } from './JobsProvider';
import { useJobs } from './useJobs';
import { mockJobDetails } from '../../data/mockJobDetails';

const STORAGE_KEY = 'smart-job-tracker-jobs';

const JobsCount = () => {
  const { jobs } = useJobs();

  return <p>{jobs.length} saved jobs</p>;
};

const UseJobsOutsideProvider = () => {
  useJobs();

  return null;
};

describe('useJobs', () => {
  it('returns the current jobs context inside JobsProvider', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([mockJobDetails[0]]));

    render(
      <JobsProvider>
        <JobsCount />
      </JobsProvider>,
    );

    expect(screen.getByText('1 saved jobs')).toBeInTheDocument();
  });

  it('throws when rendered outside JobsProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<UseJobsOutsideProvider />)).toThrow(
      'useJobs must be used inside JobsProvider',
    );
    consoleError.mockRestore();
  });
});
