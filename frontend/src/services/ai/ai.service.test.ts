import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_ERROR_CODES } from '../../types';
import { postJson } from '../api';
import { analyzeJobDescription, askJobQuestion } from './ai.service';

vi.mock('../api', () => ({
  postJson: vi.fn(),
}));

describe('ai.service', () => {
  beforeEach(() => {
    vi.mocked(postJson).mockResolvedValue({});
  });

  it('posts job descriptions with the analyze error mapping', async () => {
    await analyzeJobDescription({
      description: 'Frontend role',
    });

    expect(postJson).toHaveBeenCalledWith(
      '/api/ai/analyze-job',
      {
        description: 'Frontend role',
      },
      {
        errorCode: APP_ERROR_CODES.AI_ANALYZE_FAILED,
        fallbackErrorMessage: 'Failed to analyze job description',
      },
    );
  });

  it('posts job questions with the ask error mapping', async () => {
    await askJobQuestion({
      description: 'Frontend role',
      question: 'How should I prepare?',
    });

    expect(postJson).toHaveBeenCalledWith(
      '/api/ai/ask-job',
      {
        description: 'Frontend role',
        question: 'How should I prepare?',
      },
      {
        errorCode: APP_ERROR_CODES.AI_ASK_FAILED,
        fallbackErrorMessage: 'Failed to analyze job question',
      },
    );
  });
});
