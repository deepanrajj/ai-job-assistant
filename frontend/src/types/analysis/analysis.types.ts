/**
 * Supported seniority levels returned by job analysis.
 */
export type TJobSeniority = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Unknown';

/**
 * Represents the structured AI analysis of a job description.
 */
export type TJobAiAnalysis = {
  summary: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: TJobSeniority;
  prepTasks: string[];
};
