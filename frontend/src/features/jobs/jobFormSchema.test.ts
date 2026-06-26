import { describe, expect, it } from 'vitest';

import { createJobFormSchema } from './jobFormSchema';

const schema = createJobFormSchema({
  invalidSalary: 'Invalid salary',
  invalidSalaryRange: 'Invalid salary range',
  invalidUrl: 'Invalid URL',
  requiredCompany: 'Company required',
  requiredRole: 'Role required',
});

const validJobFormValues = {
  company: 'Acme GmbH',
  description: 'Build frontend workflows.',
  jobUrl: 'https://example.com/job',
  location: 'Berlin',
  nextStep: 'Follow up',
  roleTitle: 'Frontend Engineer',
  salaryMax: '90000',
  salaryMin: '70000',
  status: 'APPLIED',
  tags: 'React, TypeScript',
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
