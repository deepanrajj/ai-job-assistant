import { createLocalId } from './jobs.utils';
import { jobStatusOptions } from './jobs.constants';
import type {
  TJob,
  TJobAiAnalysis,
  TJobDetail,
  TJobNote,
  TJobStatus,
  TJobTask,
  TJobTimelineEvent,
} from '../../types';
import type { IUpdateJobTaskInput } from './jobsStore.types';
import { mockJobDetails } from '../../data/mockJobDetails';

/**
 * Checks whether stored data is a plain object record.
 *
 * @param {unknown} value Stored value candidate.
 * @returns {boolean} True when the value is a non-array object.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Checks whether stored data is a string.
 *
 * @param {unknown} value Stored value candidate.
 * @returns {boolean} True when the value is a string.
 */
const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Checks whether stored data is a finite number.
 *
 * @param {unknown} value Stored value candidate.
 * @returns {boolean} True when the value is a finite number.
 */
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Checks whether stored data is a supported job status.
 *
 * @param {unknown} value Stored value candidate.
 * @returns {boolean} True when the value is a job status.
 */
const isJobStatus = (value: unknown): value is TJobStatus =>
  isString(value) && jobStatusOptions.includes(value as TJobStatus);

/**
 * Reads an optional string from stored data.
 *
 * @param {unknown} value Stored value candidate.
 * @returns {string | undefined} String value or undefined.
 */
const getOptionalString = (value: unknown): string | undefined =>
  isString(value) ? value : undefined;

/**
 * Reads an optional number from stored data.
 *
 * @param {unknown} value Stored value candidate.
 * @returns {number | undefined} Number value or undefined.
 */
const getOptionalNumber = (value: unknown): number | undefined =>
  isNumber(value) ? value : undefined;

/**
 * Reads a string list from stored data.
 *
 * @param {unknown} value Stored value candidate.
 * @returns {string[]} String-only list or an empty list.
 */
const getStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter(isString) : [];

/**
 * Removes invalid normalized notes.
 *
 * @param {TJobNote | null} value Normalized note candidate.
 * @returns {boolean} True when the note is valid.
 */
const isStoredJobNote = (value: TJobNote | null): value is TJobNote => value !== null;

/**
 * Removes invalid normalized tasks.
 *
 * @param {TJobTask | null} value Normalized task candidate.
 * @returns {boolean} True when the task is valid.
 */
const isStoredJobTask = (value: TJobTask | null): value is TJobTask => value !== null;

/**
 * Removes invalid normalized timeline events.
 *
 * @param {TJobTimelineEvent | null} value Normalized timeline event candidate.
 * @returns {boolean} True when the timeline event is valid.
 */
const isStoredJobTimelineEvent = (value: TJobTimelineEvent | null): value is TJobTimelineEvent =>
  value !== null;

/**
 * Creates a timeline event for a saved job.
 *
 * @param {string} jobId Job id used in the event id.
 * @param {string} title Timeline event title.
 * @param {string} description Timeline event description.
 * @param {string} createdAt ISO timestamp for the event.
 * @returns {TJobTimelineEvent} Timeline event.
 */
export const createJobTimelineEvent = (
  jobId: string,
  title: string,
  description: string,
  createdAt: string,
): TJobTimelineEvent => ({
  createdAt,
  description,
  id: createLocalId(`${jobId}-timeline`),
  title,
});

/**
 * Creates the richer job detail shape required by the saved job workflow.
 *
 * @param {TJob} job Base job payload.
 * @param {string} createdAt ISO timestamp used for generated detail records.
 * @returns {TJobDetail} Job detail record.
 */
export const createJobDetailFromJob = (job: TJob, createdAt = job.updatedAt): TJobDetail => ({
  ...job,
  description: job.description ?? '',
  jobUrl: job.jobUrl ?? '',
  location: job.location ?? '',
  nextStep: job.nextStep ?? '',
  salaryMax: job.salaryMax ?? 0,
  salaryMin: job.salaryMin ?? 0,
  aiInsights: {
    summary: '',
    strengths: [],
    gaps: [],
  },
  notes: [],
  tasks: [],
  timeline: [
    createJobTimelineEvent(
      job.id,
      'Job saved',
      `${job.company} was added to the tracker.`,
      createdAt,
    ),
  ],
});

/**
 * Converts a job detail record back to the base job shape used by list screens.
 *
 * @param {TJobDetail} job Saved job detail.
 * @returns {TJob} Base job payload.
 */
const getBaseJob = (job: TJobDetail): TJob => ({
  company: job.company,
  createdAt: job.createdAt,
  description: job.description || undefined,
  id: job.id,
  jobUrl: job.jobUrl || undefined,
  location: job.location || undefined,
  nextStep: job.nextStep || undefined,
  roleTitle: job.roleTitle,
  salaryMax: job.salaryMax > 0 ? job.salaryMax : undefined,
  salaryMin: job.salaryMin > 0 ? job.salaryMin : undefined,
  status: job.status,
  tags: job.tags,
  updatedAt: job.updatedAt,
});

/**
 * Adds a job detail record to the local job collection.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {TJob} job Base job payload.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const addStoredJob = (jobs: TJobDetail[], job: TJob): TJobDetail[] => [
  createJobDetailFromJob(job),
  ...jobs,
];

/**
 * Updates the base fields of a saved job while preserving detail data.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {TJob} updatedJob Updated base job payload.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const updateStoredJob = (jobs: TJobDetail[], updatedJob: TJob): TJobDetail[] =>
  jobs.map((job) =>
    job.id === updatedJob.id
      ? {
          ...job,
          ...createJobDetailFromJob({
            ...getBaseJob(job),
            ...updatedJob,
          }),
          aiInsights: job.aiInsights,
          notes: job.notes,
          tasks: job.tasks,
          timeline: [
            createJobTimelineEvent(
              job.id,
              'Job updated',
              `${updatedJob.company} details were updated.`,
              updatedJob.updatedAt,
            ),
            ...job.timeline,
          ],
        }
      : job,
  );

/**
 * Deletes a saved job from the local collection.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {string} jobId Job id to delete.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const deleteStoredJob = (jobs: TJobDetail[], jobId: string): TJobDetail[] =>
  jobs.filter((job) => job.id !== jobId);

/**
 * Updates the status of a saved job and records a timeline event.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {string} jobId Job id to update.
 * @param {TJobStatus} status Next status.
 * @param {string} updatedAt ISO timestamp for the change.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const updateStoredJobStatus = (
  jobs: TJobDetail[],
  jobId: string,
  status: TJobStatus,
  updatedAt = new Date().toISOString(),
): TJobDetail[] =>
  jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          status,
          updatedAt,
          timeline: [
            createJobTimelineEvent(
              job.id,
              'Status updated',
              `Current status is ${status}.`,
              updatedAt,
            ),
            ...job.timeline,
          ],
        }
      : job,
  );

/**
 * Adds a task to a saved job.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {string} jobId Job id to update.
 * @param {string} title Task title.
 * @param {string} dueDate Task due date.
 * @param {string} createdAt ISO timestamp for the change.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const addStoredJobTask = (
  jobs: TJobDetail[],
  jobId: string,
  title: string,
  dueDate: string,
  createdAt = new Date().toISOString(),
): TJobDetail[] =>
  jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          tasks: [
            ...job.tasks,
            {
              dueDate,
              id: createLocalId(`${job.id}-task`),
              status: 'TODO',
              title,
            },
          ],
          timeline: [
            createJobTimelineEvent(job.id, 'Task added', title, createdAt),
            ...job.timeline,
          ],
          updatedAt: createdAt,
        }
      : job,
  );

/**
 * Updates a saved job task.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {string} jobId Job id to update.
 * @param {string} taskId Task id to update.
 * @param {IUpdateJobTaskInput} input Task fields to change.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const updateStoredJobTask = (
  jobs: TJobDetail[],
  jobId: string,
  taskId: string,
  input: IUpdateJobTaskInput,
): TJobDetail[] =>
  jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          tasks: job.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...input,
                }
              : task,
          ),
          updatedAt: new Date().toISOString(),
        }
      : job,
  );

/**
 * Deletes a task from a saved job.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {string} jobId Job id to update.
 * @param {string} taskId Task id to delete.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const deleteStoredJobTask = (
  jobs: TJobDetail[],
  jobId: string,
  taskId: string,
): TJobDetail[] =>
  jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          tasks: job.tasks.filter((task) => task.id !== taskId),
          updatedAt: new Date().toISOString(),
        }
      : job,
  );

/**
 * Adds a note to a saved job.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {string} jobId Job id to update.
 * @param {string} body Note body.
 * @param {string} createdAt ISO timestamp for the note.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const addStoredJobNote = (
  jobs: TJobDetail[],
  jobId: string,
  body: string,
  createdAt = new Date().toISOString(),
): TJobDetail[] =>
  jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          notes: [
            {
              body,
              createdAt,
              id: createLocalId(`${job.id}-note`),
            },
            ...job.notes,
          ],
          timeline: [
            createJobTimelineEvent(job.id, 'Note added', 'A note was added.', createdAt),
            ...job.timeline,
          ],
          updatedAt: createdAt,
        }
      : job,
  );

/**
 * Updates a saved job note.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {string} jobId Job id to update.
 * @param {string} noteId Note id to update.
 * @param {string} body Updated note body.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const updateStoredJobNote = (
  jobs: TJobDetail[],
  jobId: string,
  noteId: string,
  body: string,
): TJobDetail[] =>
  jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          notes: job.notes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  body,
                }
              : note,
          ),
          updatedAt: new Date().toISOString(),
        }
      : job,
  );

/**
 * Deletes a note from a saved job.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {string} jobId Job id to update.
 * @param {string} noteId Note id to delete.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const deleteStoredJobNote = (
  jobs: TJobDetail[],
  jobId: string,
  noteId: string,
): TJobDetail[] =>
  jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          notes: job.notes.filter((note) => note.id !== noteId),
          updatedAt: new Date().toISOString(),
        }
      : job,
  );

/**
 * Converts AI analysis into saved job detail insights and preparation tasks.
 *
 * @param {TJobDetail[]} jobs Current saved jobs.
 * @param {string} jobId Job id to update.
 * @param {TJobAiAnalysis} analysis AI analysis result.
 * @param {string} updatedAt ISO timestamp for the change.
 * @returns {TJobDetail[]} Updated jobs.
 */
export const saveStoredJobAiAnalysis = (
  jobs: TJobDetail[],
  jobId: string,
  analysis: TJobAiAnalysis,
  updatedAt = new Date().toISOString(),
): TJobDetail[] =>
  jobs.map((job) => {
    if (job.id !== jobId) return job;

    const existingTaskTitles = new Set(job.tasks.map((task) => task.title));
    const aiTasks: TJobTask[] = analysis.prepTasks
      .filter((taskTitle) => !existingTaskTitles.has(taskTitle))
      .map((taskTitle, index) => ({
        dueDate: updatedAt,
        id: `${createLocalId(`${job.id}-ai-task`)}-${index}`,
        status: 'TODO',
        title: taskTitle,
      }));

    return {
      ...job,
      aiInsights: {
        gaps: analysis.niceToHaveSkills,
        strengths: analysis.requiredSkills,
        summary: analysis.summary,
      },
      tasks: [...job.tasks, ...aiTasks],
      timeline: [
        createJobTimelineEvent(
          job.id,
          'AI analysis saved',
          'AI insights were saved to the job.',
          updatedAt,
        ),
        ...job.timeline,
      ],
      updatedAt,
    };
  });

/**
 * Creates a valid note from stored localStorage data.
 *
 * @param {unknown} value Stored note candidate.
 * @returns {TJobDetail['notes'][number] | null} Normalized note or null.
 */
const normalizeStoredJobNote = (value: unknown): TJobNote | null => {
  if (!isRecord(value)) return null;

  const { body, createdAt, id } = value;

  return isString(id) && isString(body) && isString(createdAt)
    ? {
        body,
        createdAt,
        id,
      }
    : null;
};

/**
 * Creates a valid task from stored localStorage data.
 *
 * @param {unknown} value Stored task candidate.
 * @returns {TJobTask | null} Normalized task or null.
 */
const normalizeStoredJobTask = (value: unknown): TJobTask | null => {
  if (!isRecord(value)) return null;

  const { dueDate, id, status, title } = value;

  return isString(id) &&
    isString(title) &&
    isString(dueDate) &&
    (status === 'TODO' || status === 'DONE')
    ? {
        dueDate,
        id,
        status,
        title,
      }
    : null;
};

/**
 * Creates a valid timeline event from stored localStorage data.
 *
 * @param {unknown} value Stored timeline candidate.
 * @returns {TJobTimelineEvent | null} Normalized timeline event or null.
 */
const normalizeStoredJobTimelineEvent = (value: unknown): TJobTimelineEvent | null => {
  if (!isRecord(value)) return null;

  const { createdAt, description, id, title } = value;

  return isString(id) && isString(title) && isString(description) && isString(createdAt)
    ? {
        createdAt,
        description,
        id,
        title,
      }
    : null;
};

/**
 * Creates valid AI insight data from stored localStorage data.
 *
 * @param {unknown} value Stored AI insight candidate.
 * @returns {TJobDetail['aiInsights']} Normalized AI insight data.
 */
const normalizeStoredJobAiInsights = (value: unknown): TJobDetail['aiInsights'] => {
  if (!isRecord(value)) {
    return {
      gaps: [],
      strengths: [],
      summary: '',
    };
  }

  return {
    gaps: getStringList(value.gaps),
    strengths: getStringList(value.strengths),
    summary: getOptionalString(value.summary) ?? '',
  };
};

/**
 * Creates a full job detail record from stored localStorage data.
 *
 * @param {unknown} value Stored job candidate.
 * @returns {TJobDetail | null} Normalized job detail or null.
 */
const normalizeStoredJobDetail = (value: unknown): TJobDetail | null => {
  if (!isRecord(value)) return null;

  const { company, createdAt, id, roleTitle, status, updatedAt } = value;

  if (
    !isString(id) ||
    !isString(company) ||
    !isString(roleTitle) ||
    !isJobStatus(status) ||
    !isString(createdAt) ||
    !isString(updatedAt)
  ) {
    return null;
  }

  const baseJob = createJobDetailFromJob({
    company,
    createdAt,
    description: getOptionalString(value.description),
    id,
    jobUrl: getOptionalString(value.jobUrl),
    location: getOptionalString(value.location),
    nextStep: getOptionalString(value.nextStep),
    roleTitle,
    salaryMax: getOptionalNumber(value.salaryMax),
    salaryMin: getOptionalNumber(value.salaryMin),
    status,
    tags: getStringList(value.tags),
    updatedAt,
  });
  const timeline = Array.isArray(value.timeline)
    ? value.timeline.map(normalizeStoredJobTimelineEvent).filter(isStoredJobTimelineEvent)
    : baseJob.timeline;

  return {
    ...baseJob,
    aiInsights: normalizeStoredJobAiInsights(value.aiInsights),
    notes: Array.isArray(value.notes)
      ? value.notes.map(normalizeStoredJobNote).filter(isStoredJobNote)
      : [],
    tasks: Array.isArray(value.tasks)
      ? value.tasks.map(normalizeStoredJobTask).filter(isStoredJobTask)
      : [],
    timeline: timeline.length ? timeline : baseJob.timeline,
  };
};

/**
 * Reads persisted jobs from localStorage with demo data as the fallback.
 *
 * @param {Storage} storage Browser storage implementation.
 * @param {string} storageKey Storage key to read.
 * @returns {TJobDetail[]} Stored jobs or demo jobs.
 */
export const readStoredJobs = (storage: Storage, storageKey: string): TJobDetail[] => {
  const storedJobs = storage.getItem(storageKey);

  if (!storedJobs) return mockJobDetails;

  try {
    const parsedJobs = JSON.parse(storedJobs);

    if (!Array.isArray(parsedJobs)) return mockJobDetails;

    const normalizedJobs = parsedJobs.map(normalizeStoredJobDetail);

    return normalizedJobs.every((job): job is TJobDetail => job !== null)
      ? normalizedJobs
      : mockJobDetails;
  } catch {
    return mockJobDetails;
  }
};

/**
 * Persists jobs into localStorage.
 *
 * @param {Storage} storage Browser storage implementation.
 * @param {string} storageKey Storage key to write.
 * @param {TJobDetail[]} jobs Jobs to persist.
 * @returns {void}
 */
export const writeStoredJobs = (storage: Storage, storageKey: string, jobs: TJobDetail[]): void => {
  storage.setItem(storageKey, JSON.stringify(jobs));
};
