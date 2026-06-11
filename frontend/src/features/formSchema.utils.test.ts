import { describe, expect, it } from 'vitest';

import { createRequiredTrimmedTextSchema } from './formSchema.utils';

describe('createRequiredTrimmedTextSchema', () => {
  it('trims required text values', () => {
    const schema = createRequiredTrimmedTextSchema('Required');

    expect(schema.parse('  frontend role  ')).toBe('frontend role');
  });

  it('rejects empty text with the provided message', () => {
    const schema = createRequiredTrimmedTextSchema('Required');

    expect(() => schema.parse('   ')).toThrow('Required');
  });
});
