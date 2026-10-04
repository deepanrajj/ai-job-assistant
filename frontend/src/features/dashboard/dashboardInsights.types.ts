import type { TJob } from '../../types';

/**
 * A job's recorded application: the moment of its first transition into
 * APPLIED.
 */
export interface IRecordedApplication {
  appliedAt: Date;
  job: TJob;
}

/**
 * A job still in APPLIED, with how many local calendar days ago it applied.
 */
export interface IAgingApplication {
  ageDays: number;
  job: TJob;
}

/**
 * Every dashboard insight, as `getDashboardInsights` derives it.
 * `weekEnd` is exclusive: local midnight on the following Monday.
 * `interviewRate.rate` is null when no job has a recorded application, so
 * an empty cohort can never read as 0%.
 */
export interface IDashboardInsights {
  agingApplications: {
    items: IAgingApplication[];
    total: number;
    unknownDateCount: number;
  };
  applicationsThisWeek: {
    count: number;
    unknownDateCount: number;
    weekEnd: Date;
    weekStart: Date;
  };
  interviewRate: {
    cohortSize: number;
    interviewed: number;
    rate: number | null;
  };
}
