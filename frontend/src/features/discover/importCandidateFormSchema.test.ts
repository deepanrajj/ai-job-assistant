import { describe, expect, it } from 'vitest';

import { createImportCandidateFormSchema } from './importCandidateFormSchema';

const schema = createImportCandidateFormSchema(
  'Required',
  'Invalid source link',
  'Too long',
  'URL too long',
);
const values = {
  company: 'N26',
  description: 'Text',
  location: '',
  roleTitle: 'Engineer',
  sourceUrl: '',
};

describe('createImportCandidateFormSchema', () => {
  it('requires nonblank company, role, and description', () => {
    const result = schema.safeParse({ ...values, company: ' ', description: '', roleTitle: '\t' });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.flatten().fieldErrors).toMatchObject({
        company: ['Required'],
        description: ['Required'],
        roleTitle: ['Required'],
      });
  });

  it.each(['https://', 'http://', 'ftp://example.com', 'https://exa mple.com'])(
    'rejects an invalid source link: %s',
    (sourceUrl) => {
      const result = schema.safeParse({ ...values, sourceUrl });

      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.flatten().fieldErrors.sourceUrl).toEqual(['Invalid source link']);
    },
  );

  it.each(['', '  ', 'https://example.com/job', 'http://localhost:3000/job'])(
    'accepts an optional HTTP(S) source link: %s',
    (sourceUrl) => {
      expect(schema.safeParse({ ...values, sourceUrl }).success).toBe(true);
    },
  );

  it.each(['company', 'location', 'roleTitle'] as const)(
    'accepts 255 characters and rejects 256 in %s after trimming',
    (field) => {
      expect(schema.safeParse({ ...values, [field]: ` ${'a'.repeat(255)} ` }).success).toBe(true);

      const result = schema.safeParse({ ...values, [field]: 'a'.repeat(256) });

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.flatten().fieldErrors[field]).toEqual(['Too long']);
    },
  );

  it('accepts a 2048-character source link and rejects a 2049-character one', () => {
    const base = 'https://example.com/';

    expect(
      schema.safeParse({ ...values, sourceUrl: base + 'a'.repeat(2048 - base.length) }).success,
    ).toBe(true);

    const result = schema.safeParse({
      ...values,
      sourceUrl: base + 'a'.repeat(2049 - base.length),
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.flatten().fieldErrors.sourceUrl).toEqual(['URL too long']);
  });
});
