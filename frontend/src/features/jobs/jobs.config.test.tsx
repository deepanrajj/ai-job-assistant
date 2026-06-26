import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  createJobsActions,
  createJobsColumns,
  createJobsFilters,
  createJobsSearchConfig,
} from './jobs.config';
import { renderWithProviders } from '../../test/renderWithProviders';
import { renderWithRouter } from '../../test/renderWithRouter';
import { translate, type TTranslationContextValue } from '../../i18n';
import { createMockJob } from '../../test/mockJobs';

const t: TTranslationContextValue['t'] = (key, params) => translate(key, params, 'en');

describe('jobs config', () => {
  it('creates search config for job text fields', () => {
    const searchConfig = createJobsSearchConfig(t);

    expect(searchConfig.label).toBe('Search');
    expect(searchConfig.getSearchText(createMockJob())).toContain('Acme GmbH');
    expect(searchConfig.getSearchText(createMockJob())).toContain('React');
    expect(
      searchConfig.getSearchText(
        createMockJob({
          location: undefined,
        }),
      ),
    ).not.toContain('undefined');
  });

  it('creates localized columns that render job cell content', () => {
    const job = createMockJob();
    const columns = createJobsColumns({
      language: 'en',
      t,
    });
    const roleColumn = columns.find((column) => column.id === 'role');
    const statusColumn = columns.find((column) => column.id === 'status');
    const companyColumn = columns.find((column) => column.id === 'company');
    const locationColumn = columns.find((column) => column.id === 'location');
    const salaryColumn = columns.find((column) => column.id === 'salary');
    const updatedColumn = columns.find((column) => column.id === 'updated');
    const actionsColumn = columns.find((column) => column.id === 'actions');

    if (
      !companyColumn ||
      !roleColumn ||
      !statusColumn ||
      !locationColumn ||
      !salaryColumn ||
      !updatedColumn ||
      !actionsColumn
    )
      throw new Error('Expected jobs columns to exist');

    expect(columns.map((column) => column.id)).toEqual([
      'company',
      'role',
      'status',
      'location',
      'salary',
      'updated',
      'actions',
    ]);
    expect(companyColumn.sortValue?.(job)).toBe('Acme GmbH');
    expect(roleColumn.sortValue?.(job)).toBe('Frontend Engineer');
    expect(statusColumn.sortValue?.(job)).toBe('Applied');
    expect(locationColumn.sortValue?.(job)).toBe('Berlin');
    expect(salaryColumn.sortValue?.(job)).toBe(70000);
    expect(salaryColumn.sortValue?.(createMockJob({ salaryMin: undefined }))).toBe(90000);
    expect(updatedColumn.sortValue?.(job)).toEqual(new Date(job.updatedAt));

    const { container } = renderWithRouter(
      <>
        {companyColumn.cell(job)}
        {roleColumn.cell(job)}
        {statusColumn.cell(job)}
        <span>{locationColumn.cell(createMockJob({ location: undefined }))}</span>
        <span>
          {salaryColumn.cell(createMockJob({ salaryMax: undefined, salaryMin: undefined }))}
        </span>
        {updatedColumn.cell(job)}
        {actionsColumn.cell(job)}
      </>,
    );

    expect(screen.getByText('Acme GmbH')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View details for Acme GmbH' })).toHaveAttribute(
      'href',
      '/jobs/job-001',
    );
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Next: Follow up')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(container).toHaveTextContent('Not setNot set');
    expect(screen.getByText('Jan 2, 2026')).toBeInTheDocument();
  });

  it('omits optional role details when they are not set', () => {
    const columns = createJobsColumns({
      language: 'en',
      t,
    });
    const roleColumn = columns.find((column) => column.id === 'role');

    if (!roleColumn) throw new Error('Expected role column to exist');

    renderWithProviders(<>{roleColumn.cell(createMockJob({ nextStep: undefined, tags: [] }))}</>);

    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument();
  });

  it('creates actions and filters', () => {
    const handleAddJob = vi.fn();
    const handleStatusFilterChange = vi.fn();
    render(
      <>
        {createJobsActions({ onAddJob: handleAddJob, t })}
        {createJobsFilters({
          onStatusFilterChange: handleStatusFilterChange,
          statusFilter: 'ALL',
          t,
        })}
      </>,
    );

    screen.getByRole('button', { name: 'Add Job' }).click();

    expect(handleAddJob).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('ALL');
    expect(screen.getByRole('option', { name: 'All statuses' })).toBeInTheDocument();
  });
});
