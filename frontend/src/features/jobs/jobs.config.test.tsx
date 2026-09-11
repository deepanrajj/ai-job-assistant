import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  createJobsActions,
  createJobsColumns,
  createJobsFilters,
  createJobsSearchConfig,
} from './jobs.config';
import { renderWithRouter } from '../../test/renderWithRouter';
import {
  supportedLanguages,
  translate,
  type TLanguage,
  type TTranslationContextValue,
} from '../../i18n';
import { createMockJob } from '../../test/mockJobs';

const t: TTranslationContextValue['t'] = (key, params) => translate(key, params, 'en');

/**
 * Search placeholder copy expected for each supported language.
 *
 * The placeholder is the only thing telling a user which fields the search
 * matches against, so it may name a field only while `getSearchText` reads it.
 * Changing a sentence here means checking that function first.
 */
const expectedSearchPlaceholders: Record<TLanguage, string> = {
  de: 'Firma, Rolle oder Standort suchen',
  en: 'Search company, role, or location',
};

describe('jobs config', () => {
  it('creates search config for job text fields', () => {
    const searchConfig = createJobsSearchConfig(t);

    expect(searchConfig.label).toBe('Search');
    expect(searchConfig.getSearchText(createMockJob())).toContain('Acme GmbH');
    expect(searchConfig.getSearchText(createMockJob())).toContain('Frontend Engineer');
    expect(
      searchConfig.getSearchText(
        createMockJob({
          location: undefined,
        }),
      ),
    ).not.toContain('undefined');
  });

  it('describes only the job fields the search reads', () => {
    const job = createMockJob({
      company: 'Northwind Systems',
      location: 'Hamburg',
      roleTitle: 'Platform Engineer',
    });

    supportedLanguages.forEach((language) => {
      const searchConfig = createJobsSearchConfig((key, params) =>
        translate(key, params, language),
      );

      expect(searchConfig.getSearchText(job)).toBe('Northwind Systems Platform Engineer Hamburg');
      expect(searchConfig.placeholder).toBe(expectedSearchPlaceholders[language]);
    });
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
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(container).toHaveTextContent('Not setNot set');
    expect(screen.getByText('Jan 2, 2026')).toBeInTheDocument();
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
