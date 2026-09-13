import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useJobDetail } from './useJobDetail';
import { MOCK_JOB_IDS, createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';

const JobDetailProbe = () => {
  const { job } = useJobDetail(MOCK_JOB_IDS.celonis);

  if (!job) return <p>no job</p>;

  return (
    <p>
      {job.company} description=[{job.description}] salaryMin={job.salaryMin} notes=
      {job.notes.length} timeline={job.timeline.length}
    </p>
  );
};

describe('useJobDetail', () => {
  // Every request behaviour belongs to `useJob` and is tested there. What is
  // left here is the widening this hook adds.
  it('widens the loaded job into the detail shape', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}`, () =>
        HttpResponse.json(
          createMockJobResponse({
            company: 'Celonis',
            description: null,
            id: MOCK_JOB_IDS.celonis,
            salaryMin: null,
          }),
        ),
      ),
    );
    render(<JobDetailProbe />);

    // The optional fields become present, which is what the detail screen
    // renders against, and the collections start empty because no endpoint
    // carries them yet.
    expect(await screen.findByText(/Celonis/)).toHaveTextContent(
      'Celonis description=[] salaryMin=0 notes=0 timeline=0',
    );
  });
});
