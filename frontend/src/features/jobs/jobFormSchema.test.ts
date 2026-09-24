import { describe, expect, it } from 'vitest';

import { jobSourceOptions } from './jobs.constants';
import { createJobFormSchema } from './jobFormSchema';

const schema = createJobFormSchema({
  invalidSalary: 'Invalid salary',
  invalidSalaryRange: 'Invalid salary range',
  invalidUrl: 'Invalid URL',
  requiredCompany: 'Company required',
  requiredRole: 'Role required',
  tooLongText: 'Too long',
  tooLongUrl: 'URL too long',
});

const validJobFormValues = {
  company: 'Acme GmbH',
  description: 'Build frontend workflows.',
  jobUrl: 'https://example.com/job',
  location: 'Berlin',
  roleTitle: 'Frontend Engineer',
  salaryMax: '90000',
  salaryMin: '70000',
  source: '',
  status: 'APPLIED',
};

describe('job form schema', () => {
  it('trims and validates submitted job form values', () => {
    const result = schema.parse({
      ...validJobFormValues,
      company: ' Acme GmbH ',
      roleTitle: ' Frontend Engineer ',
    });

    expect(result.company).toBe('Acme GmbH');
    expect(result.roleTitle).toBe('Frontend Engineer');
  });

  it('requires company and role values', () => {
    const result = schema.safeParse({
      ...validJobFormValues,
      company: ' ',
      roleTitle: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Company required',
      'Role required',
    ]);
  });

  it('allows optional URL and salary values to stay empty', () => {
    const result = schema.safeParse({
      ...validJobFormValues,
      jobUrl: '',
      salaryMax: '',
      salaryMin: '',
    });

    expect(result.success).toBe(true);
  });

  it('accepts every job source and an empty source', () => {
    jobSourceOptions.forEach((source) => {
      expect(schema.safeParse({ ...validJobFormValues, source }).success).toBe(true);
    });
    expect(schema.safeParse({ ...validJobFormValues, source: '' }).success).toBe(true);
  });

  it('rejects a source that is not one of the supported sources', () => {
    expect(schema.safeParse({ ...validJobFormValues, source: 'MONSTER' }).success).toBe(false);
  });

  it('rejects invalid URL and salary values', () => {
    const result = schema.safeParse({
      ...validJobFormValues,
      jobUrl: 'not-a-url',
      salaryMin: '-1',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Invalid URL',
      'Invalid salary',
    ]);
  });

  it('rejects values past the limits the backend enforces', () => {
    // Mirrors `JobFieldLimits.kt`. Without these the form sends values the
    // API rejects with a 400 that names the offending field only in
    // `fieldErrors`, which this client does not read, so the user is told
    // that validation failed and never which field to fix.
    expect(schema.safeParse({ ...validJobFormValues, company: 'a'.repeat(256) }).success).toBe(
      false,
    );
    expect(schema.safeParse({ ...validJobFormValues, location: 'a'.repeat(256) }).success).toBe(
      false,
    );
    expect(schema.safeParse({ ...validJobFormValues, roleTitle: 'a'.repeat(256) }).success).toBe(
      false,
    );
    expect(
      schema.safeParse({ ...validJobFormValues, salaryMax: '99999999999', salaryMin: '1' }).success,
    ).toBe(false);
    // `@Digits` caps the decimal places too, and the request carries the
    // number rather than the typed text: "1.5e3" arrives as 1500.
    expect(schema.safeParse({ ...validJobFormValues, salaryMin: '70000.555' }).success).toBe(false);
    expect(schema.safeParse({ ...validJobFormValues, salaryMin: '70000.55' }).success).toBe(true);
    expect(schema.safeParse({ ...validJobFormValues, salaryMin: '1.5e3' }).success).toBe(true);
    // `NUMERIC(12, 2)` stores ten integer digits plus two decimals, so the
    // limit counts the whole-number part rather than capping the value.
    expect(
      schema.safeParse({ ...validJobFormValues, salaryMax: '9999999999.99', salaryMin: '1' })
        .success,
    ).toBe(true);
    expect(
      schema.safeParse({ ...validJobFormValues, salaryMax: '10000000000', salaryMin: '1' }).success,
    ).toBe(false);
    expect(schema.safeParse({ ...validJobFormValues, company: 'a'.repeat(255) }).success).toBe(
      true,
    );
  });

  it('rejects zero salary values', () => {
    const result = schema.safeParse({
      ...validJobFormValues,
      salaryMax: '0',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Invalid salary');
  });

  it('rejects a maximum salary lower than the minimum salary', () => {
    const result = schema.safeParse({
      ...validJobFormValues,
      salaryMax: '60000',
      salaryMin: '70000',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Invalid salary range');
    expect(result.error?.issues[0]?.path).toEqual(['salaryMax']);
  });
});
