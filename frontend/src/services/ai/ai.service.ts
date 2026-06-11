import { postJson } from '../api';
import { getAiFallbackErrorMessage } from './ai.utils';
import type { TAnalyzeJobRequest, TAskJobRequest } from './ai.types';
import { APP_ERROR_CODES, type TJobAiAnalysis, type TJobAiAsk } from '../../types';

/**
 * Sends a job description to the backend.
 *
 * @param {TAnalyzeJobRequest} payload Job description analysis request body.
 * @returns {Promise<TJobAiAnalysis>} Structured AI analysis for the job description.
 */
export const analyzeJobDescription = (payload: TAnalyzeJobRequest): Promise<TJobAiAnalysis> =>
  postJson<TJobAiAnalysis, TAnalyzeJobRequest>('/api/ai/analyze-job', payload, {
    errorCode: APP_ERROR_CODES.AI_ANALYZE_FAILED,
    fallbackErrorMessage: getAiFallbackErrorMessage('analyzeJob'),
  });

/**
 * Sends a follow-up question about a job description to the backend.
 *
 * @param {TAskJobRequest} payload Question request body with job description context.
 * @returns {Promise<TJobAiAsk>} AI answer for the submitted question.
 */
export const askJobQuestion = (payload: TAskJobRequest): Promise<TJobAiAsk> =>
  postJson<TJobAiAsk, TAskJobRequest>('/api/ai/ask-job', payload, {
    errorCode: APP_ERROR_CODES.AI_ASK_FAILED,
    fallbackErrorMessage: getAiFallbackErrorMessage('askJob'),
  });
