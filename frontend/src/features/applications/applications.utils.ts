import { DOCUMENT_TYPES, type TJob, type TJobDocumentType } from '../../types';
import type {
  IApplicationDocumentCounts,
  IApplicationGroup,
  TApplicationDocument,
} from './applications.types';

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

/**
 * Counts the grouped documents: how many were submitted, how many are not
 * sent yet, and how many jobs have any. Counted from the groups, so the
 * documents of deleted jobs are left out, as they are from the list.
 *
 * @param {IApplicationGroup[]} groups Documents grouped by job.
 * @returns {IApplicationDocumentCounts} The counts.
 */
export const countApplicationDocuments = (
  groups: IApplicationGroup[],
): IApplicationDocumentCounts => {
  const documents = groups.flatMap((group) => group.documents);
  const submitted = documents.filter((document) => document.submittedAt).length;

  return { jobs: groups.length, notSent: documents.length - submitted, submitted };
};

/**
 * The document types the matrix shows as columns: those any grouped
 * document has, in `DOCUMENT_TYPES` order. The page passes every job, not
 * just those shown, so columns stay put while searching, filtering, or
 * paging; a narrowed list can then show a column of dashes.
 *
 * @param {IApplicationGroup[]} groups Documents grouped by job.
 * @returns {TJobDocumentType[]} Types in use, in column order.
 */
export const getDocumentTypeColumns = (groups: IApplicationGroup[]): TJobDocumentType[] => {
  const used = new Set(groups.flatMap((group) => group.documents.map((document) => document.type)));

  return DOCUMENT_TYPES.filter((type) => used.has(type));
};
