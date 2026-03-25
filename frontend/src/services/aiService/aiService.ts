import type { JobAiAnalysis } from '../../types';

type AnalyzeJobRequest = {
  description: string;
};

export async function analyzeJobDescription(
  payload: AnalyzeJobRequest
): Promise<JobAiAnalysis> {
  const response = await fetch('/api/ai/analyze-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = 'Failed to analyze job description';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      // ignore JSON parse errors for error body
    }
    throw new Error(message);
  }

  const data = (await response.json()) as JobAiAnalysis;
  return data;
}
