import type { TJob } from '../../types';
import type { TApplicationDocument, IApplicationGroup } from './applications.types';

/**
 * Groups documents by job, keeping the order the API returned them in:
 * the job with the most recently submitted document comes first, and each
 * job's documents stay in that same order. Documents whose job is not in
 * `jobs` (deleted since) are left out.
 *
 * @param {TJob[]} jobs Saved jobs.
 * @param {TApplicationDocument[]} documents Every job's documents, as the API ordered them.
 * @returns {IApplicationGroup[]} One group per job that has documents.
 */
export const groupDocumentsByJob = (
  jobs: TJob[],
  documents: TApplicationDocument[],
): IApplicationGroup[] => {
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const groups = new Map<string, IApplicationGroup>();

  for (const document of documents) {
    const job = jobsById.get(document.jobId);

    if (!job) continue;

    const group = groups.get(job.id) ?? { documents: [], job };

    group.documents.push(document);
    groups.set(job.id, group);
  }

  return [...groups.values()];
};
