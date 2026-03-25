export type JobAiAnalysis = {
  summary: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Unknown';
  prepTasks: string[];
};
