import { describe, expect, it } from 'vitest';

import { createAskJobFormSchema } from './askJobFormSchema';

describe('createAskJobFormSchema', () => {
  it('validates and trims ask job form values', () => {
    const schema = createAskJobFormSchema({
      emptyQuestion: 'Question required',
    });

    expect(schema.parse({ question: '  What should I prepare?  ' })).toEqual({
      question: 'What should I prepare?',
    });
    expect(() => schema.parse({ question: '' })).toThrow('Question required');
  });
});
