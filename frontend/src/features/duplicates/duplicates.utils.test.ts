import { describe, expect, it } from 'vitest';

import {
  classifyDuplicate,
  normalizeCompany,
  normalizeDuplicateText,
  normalizeJobUrl,
} from './duplicates.utils';
import { createMockJob } from '../../test/mockJobs';

const savedJob = createMockJob({
  company: 'N26 GmbH',
  id: 'job-n26',
  jobUrl: 'https://www.example.com/jobs/123/',
  location: 'Berlin',
  roleTitle: 'Backend Engineer',
});

const candidate = (overrides: Partial<Parameters<typeof classifyDuplicate>[0]> = {}) => ({
  company: 'Someone Else',
  location: 'Hamburg',
  roleTitle: 'Designer',
  url: null,
  ...overrides,
});

describe('normalization', () => {
  it('lower-cases, removes accents and punctuation, and collapses whitespace', () => {
    expect(normalizeDuplicateText('  Senior  Back-End   Engineer (m/w/d) ')).toBe(
      'senior back end engineer m w d',
    );
    expect(normalizeDuplicateText('München')).toBe('munchen');
  });

  it('drops legal suffixes from company names', () => {
    expect(normalizeCompany('N26 GmbH')).toBe('n26');
    expect(normalizeCompany('Acme, Inc.')).toBe('acme');
    expect(normalizeCompany('SAP SE')).toBe('sap');
  });

  it('ignores scheme, www, trailing slash, fragment, and utm parameters in URLs', () => {
    expect(normalizeJobUrl('http://www.Example.com/jobs/123/?utm_source=x#apply')).toBe(
      normalizeJobUrl('https://example.com/jobs/123'),
    );
  });

  it('keeps other query parameters, which can identify the job', () => {
    expect(normalizeJobUrl('https://boards.example.com/view?gh_jid=1')).not.toBe(
      normalizeJobUrl('https://boards.example.com/view?gh_jid=2'),
    );
  });

  it('treats a missing or unparseable URL as no URL', () => {
    expect(normalizeJobUrl(null)).toBe('');
    expect(normalizeJobUrl('not a url')).toBe('');
  });
});

describe('classifyDuplicate', () => {
  it('calls the same URL a likely duplicate, whatever else differs', () => {
    expect(
      classifyDuplicate(candidate({ url: 'http://example.com/jobs/123?utm_medium=mail' }), [
        savedJob,
      ]),
    ).toEqual({ classification: 'LIKELY_DUPLICATE', job: savedJob, reason: 'SAME_URL' });
  });

  it('calls the same company and role a likely duplicate across case and legal suffix', () => {
    expect(
      classifyDuplicate(candidate({ company: 'n26', roleTitle: 'BACKEND ENGINEER' }), [savedJob]),
    ).toMatchObject({ classification: 'LIKELY_DUPLICATE', reason: 'SAME_COMPANY_AND_ROLE' });
  });

  it('calls a similar role at the same company a possible duplicate', () => {
    expect(
      classifyDuplicate(candidate({ company: 'N26', roleTitle: 'Senior Backend Engineer' }), [
        savedJob,
      ]),
    ).toMatchObject({ classification: 'POSSIBLE_DUPLICATE', reason: 'SIMILAR_ROLE_SAME_COMPANY' });
  });

  it('calls the same role and location at another company a possible duplicate', () => {
    expect(
      classifyDuplicate(
        candidate({ company: 'Agency', location: ' berlin ', roleTitle: 'Backend engineer' }),
        [savedJob],
      ),
    ).toMatchObject({ classification: 'POSSIBLE_DUPLICATE', reason: 'SAME_ROLE_AND_LOCATION' });
  });

  it('does not count a different role at the same company as similar', () => {
    expect(
      classifyDuplicate(candidate({ company: 'N26', roleTitle: 'Product Designer' }), [savedJob]),
    ).toEqual({
      classification: 'NEW',
    });
  });

  it('calls an unrelated candidate new, and anything new when there are no jobs', () => {
    expect(classifyDuplicate(candidate(), [savedJob])).toEqual({ classification: 'NEW' });
    expect(classifyDuplicate(candidate({ company: 'N26' }), [])).toEqual({ classification: 'NEW' });
  });

  it('takes the strongest match across jobs', () => {
    const possible = createMockJob({
      company: 'N26',
      id: 'job-possible',
      roleTitle: 'Senior Backend Engineer',
    });
    const likely = createMockJob({
      company: 'N26',
      id: 'job-likely',
      roleTitle: 'Backend Engineer',
    });

    expect(
      classifyDuplicate(candidate({ company: 'N26', roleTitle: 'Backend Engineer' }), [
        possible,
        likely,
      ]),
    ).toMatchObject({ classification: 'LIKELY_DUPLICATE', job: likely });
  });

  it('does not match on empty values', () => {
    const blank = createMockJob({ company: '', id: 'blank', location: '', roleTitle: '' });

    expect(
      classifyDuplicate(candidate({ company: '', location: '', roleTitle: '' }), [blank]),
    ).toEqual({
      classification: 'NEW',
    });
  });
});
