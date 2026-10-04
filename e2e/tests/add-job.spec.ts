import { randomUUID } from 'node:crypto';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * The fields of `GET /api/jobs` this suite reads.
 */
interface IJobSummary {
  company: string;
  id: string;
}

/**
 * A company name no other test or run can produce, so the journey only
 * ever asserts on its own row, however much data the target already has.
 */
const createUniqueCompany = (): string => `E2E ${randomUUID().slice(0, 8)}`;

/**
 * Deletes every job with the given company through the API. Runs after
 * each test so a local cluster database does not collect test rows.
 */
const deleteJobsByCompany = async (request: APIRequestContext, company: string) => {
  const response = await request.get('/api/jobs');

  expect(response.ok()).toBe(true);

  const jobs = (await response.json()) as IJobSummary[];

  for (const job of jobs.filter((candidate) => candidate.company === company)) {
    const deleted = await request.delete(`/api/jobs/${encodeURIComponent(job.id)}`);

    expect(deleted.ok()).toBe(true);
  }
};

/**
 * Narrows the jobs list to one company through its search box. The list
 * shows five rows per page and does not put new jobs first, so on any
 * real database the new row is usually not on page one.
 */
const searchJobs = async (page: Page, company: string) => {
  await page.getByLabel('Search').fill(company);
};

test.describe('add a job', () => {
  let company = '';

  test.beforeEach(() => {
    company = createUniqueCompany();
  });

  test.afterEach(async ({ request }) => {
    await deleteJobsByCompany(request, company);
  });

  test('a job created through the form is still listed after a reload', async ({ page }) => {
    await page.goto('/jobs/new');
    await page.getByLabel('Company').fill(company);
    await page.getByLabel('Role').fill('Platform Engineer');
    await page.getByRole('button', { name: 'Create job' }).click();

    await expect(page).toHaveURL(/\/jobs$/);
    await searchJobs(page, company);
    await expect(page.getByRole('row', { name: new RegExp(company) })).toBeVisible();

    // The reload is the point: without it the test only proves React
    // state changed. After it, the row can only come from the database.
    await page.reload();
    await searchJobs(page, company);
    await expect(page.getByRole('row', { name: new RegExp(company) })).toBeVisible();
  });
});
