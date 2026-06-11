import { describe, expect, it } from 'vitest';

import { createAnalyzeJobFormSchema } from './analyzeJobFormSchema';

describe('createAnalyzeJobFormSchema', () => {
  it('validates and trims analyze job form values', () => {
    const schema = createAnalyzeJobFormSchema({
      emptyDescription: 'Description required',
    });

    expect(schema.parse({ description: '  Full description  ' })).toEqual({
      description: 'Full description',
    });
    expect(() => schema.parse({ description: '' })).toThrow('Description required');
  });
});
