import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createNote,
  deleteNote,
  getNotes,
  mapNoteResponseToJobNote,
  updateNote,
  type TCreateNoteRequest,
  type TNoteResponse,
  type TUpdateNoteRequest,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';
import type { TJobNote } from '../../types';

/**
 * Arguments accepted by the note creation mutation.
 */
interface ICreateJobNoteInput {
  jobId: string;
  payload: TCreateNoteRequest;
}

/**
 * Arguments accepted by the note update mutation.
 */
interface IUpdateJobNoteInput {
  jobId: string;
  noteId: string;
  payload: TUpdateNoteRequest;
}

/**
 * Arguments accepted by the note delete mutation.
 */
interface IDeleteJobNoteInput {
  jobId: string;
  noteId: string;
}

/**
 * Job notes state returned by useJobNotes.
 *
 * `createJobNote`, `updateJobNote`, and `deleteJobNote` all reject when
 * their write fails, after `mutationError` is already set, matching the
 * contract `useJobTasks` settled on for its own three writes: a caller
 * that needs to react to the outcome can await and catch, and one that
 * does not can ignore the rejection and rely on `mutationError` alone.
 */
export interface IJobNotesState {
  createJobNote: (body: string) => Promise<void>;
  deleteJobNote: (noteId: string) => Promise<void>;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  notes: TJobNote[];
  reload: () => void;
  updateJobNote: (noteId: string, body: string) => Promise<void>;
}

/**
 * Declared at module level so each mutation's identity stays stable across
 * renders, as `useJobTasks` does for its own three writes:
 * `useAsyncMutation` keys `mutate` on the mutation function, and a closure
 * built inside the hook body would get a new identity on every render.
 */
const postNoteFields = ({ jobId, payload }: ICreateJobNoteInput): Promise<TNoteResponse> =>
  createNote(jobId, payload);

const putNoteFields = ({ jobId, noteId, payload }: IUpdateJobNoteInput): Promise<TNoteResponse> =>
  updateNote(jobId, noteId, payload);

const removeNoteFields = ({ jobId, noteId }: IDeleteJobNoteInput): Promise<void> =>
  deleteNote(jobId, noteId);

/**
 * Loads a job's notes from the backend and offers create, update, and
 * delete against the same job.
 *
 * Every write reloads the list from the server rather than patching it
 * locally, so the rendered notes are always what the last `GET` returned.
 * Optimistic local updates are task 035's concern. Unlike `useJobTasks`,
 * `updateJobNote` needs no merge against the currently loaded note:
 * `UpdateNoteRequest` has exactly one field, and every caller already has
 * the note's full new body from its own textarea state.
 *
 * @param {string} jobId Job identifier the notes belong to.
 * @returns {IJobNotesState} Loaded notes, request state, and the three writes.
 */
export const useJobNotes = (jobId: string): IJobNotesState => {
  const {
    mutate: loadNotes,
    request: { data, error: loadError, isIdle, isLoading },
  } = useAsyncMutation<string, TNoteResponse[]>(getNotes);
  const {
    mutate: postNote,
    request: { isLoading: isCreating },
  } = useAsyncMutation<ICreateJobNoteInput, TNoteResponse>(postNoteFields);
  const {
    mutate: putNote,
    request: { isLoading: isUpdating },
  } = useAsyncMutation<IUpdateJobNoteInput, TNoteResponse>(putNoteFields);
  const {
    mutate: removeNote,
    request: { isLoading: isDeleting },
  } = useAsyncMutation<IDeleteJobNoteInput, void>(removeNoteFields);

  /**
   * Tracked here rather than derived from the three mutations' own error
   * states, for the same reason `useJobTasks` does: each of those only
   * clears when that same mutation runs again, so a failed create followed
   * by a successful update would otherwise still show the create's stale
   * error.
   */
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  const reload = useCallback(() => {
    loadNotes(jobId).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [jobId, loadNotes]);

  useEffect(() => {
    reload();
  }, [reload]);

  const notes = useMemo(
    () => (Array.isArray(data) ? data.map(mapNoteResponseToJobNote) : []),
    [data],
  );

  const createJobNote = useCallback(
    (body: string) =>
      postNote({ jobId, payload: { body } }).then(
        () => {
          setMutationError(null);
          reload();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      ),
    [jobId, postNote, reload],
  );

  const updateJobNote = useCallback(
    (noteId: string, body: string) =>
      putNote({ jobId, noteId, payload: { body } }).then(
        () => {
          setMutationError(null);
          reload();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      ),
    [jobId, putNote, reload],
  );

  const deleteJobNote = useCallback(
    (noteId: string) =>
      removeNote({ jobId, noteId }).then(
        () => {
          setMutationError(null);
          reload();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      ),
    [jobId, removeNote, reload],
  );

  return {
    createJobNote,
    deleteJobNote,
    isLoading: isIdle || isLoading,
    isMutating: isCreating || isUpdating || isDeleting,
    loadError,
    mutationError,
    notes,
    reload,
    updateJobNote,
  };
};
