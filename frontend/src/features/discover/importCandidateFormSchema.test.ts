import { describe, expect, it } from 'vitest';

import { createImportCandidateFormSchema } from './importCandidateFormSchema';

const schema = createImportCandidateFormSchema('Required', 'Invalid source link');
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
});
