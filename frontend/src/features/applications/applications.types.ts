import type { TJob, TJobDocument } from '../../types';

/**
 * A document as the Applications page shows it, with the job it belongs
 * to.
 */
export type TApplicationDocument = TJobDocument & {
  jobId: string;
};

/**
 * One job and its documents, in the order the page lists them.
 */
export interface IApplicationGroup {
  documents: TApplicationDocument[];
  job: TJob;
}
