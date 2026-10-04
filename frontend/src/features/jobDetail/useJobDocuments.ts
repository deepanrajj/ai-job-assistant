import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildDocumentRequestPayload,
  createDocument,
  deleteDocument,
  getDocuments,
  mapDocumentResponseToJobDocument,
  updateDocument,
  type IDocumentFormValues,
  type TDocumentResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';
import type { TJobDocument } from '../../types';

/**
 * Arguments accepted by the document creation mutation.
 */
interface ICreateJobDocumentInput {
  jobId: string;
  values: IDocumentFormValues;
}

/**
 * Arguments accepted by the document update mutation.
 */
interface IUpdateJobDocumentInput {
  documentId: string;
  jobId: string;
  values: IDocumentFormValues;
}

/**
 * Arguments accepted by the document delete mutation.
 */
interface IDeleteJobDocumentInput {
  documentId: string;
  jobId: string;
}

/**
 * Job documents state returned by useJobDocuments.
 *
 * `createJobDocument`, `updateJobDocument`, and `deleteJobDocument` all reject
 * when their write fails, after `mutationError` is already set, matching
 * the contract `useJobNotes` settled on for its own three writes: a caller
 * that needs to react to the outcome can await and catch, and one that
 * does not can ignore the rejection and rely on `mutationError` alone.
 */
export interface IJobDocumentsState {
  documents: TJobDocument[];
  createJobDocument: (values: IDocumentFormValues) => Promise<void>;
  deleteJobDocument: (documentId: string) => Promise<void>;
  deletingDocumentIds: ReadonlySet<string>;
  /**
   * True once this job has a list to show, even when the latest reload
   * failed, so a failed refresh can be reported without hiding the list.
   */
  hasLoadedDocuments: boolean;
  isCreating: boolean;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  reload: () => void;
  updateJobDocument: (documentId: string, values: IDocumentFormValues) => Promise<void>;
  updatingDocumentIds: ReadonlySet<string>;
}

/**
 * Declared at module level so each mutation's identity stays stable across
 * renders, as `useJobNotes` does for its own three writes: `useAsyncMutation`
 * keys `mutate` on the mutation function, and a closure built inside the
 * hook body would get a new identity on every render.
 */
const postDocumentFields = ({
  jobId,
  values,
}: ICreateJobDocumentInput): Promise<TDocumentResponse> =>
  createDocument(jobId, buildDocumentRequestPayload(values));

const putDocumentFields = ({
  documentId,
  jobId,
  values,
}: IUpdateJobDocumentInput): Promise<TDocumentResponse> =>
  updateDocument(jobId, documentId, buildDocumentRequestPayload(values));

const removeDocumentFields = ({ documentId, jobId }: IDeleteJobDocumentInput): Promise<void> =>
  deleteDocument(jobId, documentId);

/**
 * Returns a copy of `ids` with `id` added or removed, for use as a state
 * updater so overlapping writes each change only their own entry.
 *
 * @param {ReadonlySet<string>} ids Current set of busy document ids.
 * @param {string} id Document id to add or remove.
 * @param {boolean} isBusy Whether the id should be in the result.
 * @returns {ReadonlySet<string>} Updated set of busy document ids.
 */
const toggleDocumentId = (
  ids: ReadonlySet<string>,
  id: string,
  isBusy: boolean,
): ReadonlySet<string> => {
  const next = new Set(ids);

  if (isBusy) next.add(id);
  else next.delete(id);

  return next;
};

const noDocumentIds: ReadonlySet<string> = new Set();

/**
 * Loads a job's application documents from the backend and offers create,
 * update, and delete against the same job. Mirrors `useJobContacts`, whose
 * reasoning applies line for line.
 *
 * Every write reloads the list from the server, after applying the
 * confirmed result to the cached list so a failed reload cannot show the
 * pre-write list. `createJobDocument` and `updateJobDocument` both take the raw
 * form values and build the request payload themselves, through
 * `buildDocumentRequestPayload`, so a blank optional field is turned into
 * `null` in exactly one place regardless of which caller triggers it.
 *
 * @param {string} jobId Job identifier the documents belong to.
 * @returns {IJobDocumentsState} Loaded documents, request state, and the three writes.
 */
export const useJobDocuments = (jobId: string): IJobDocumentsState => {
  const {
    mutate: loadDocuments,
    request: { data, error: loadError, isIdle, isLoading },
  } = useAsyncMutation<string, TDocumentResponse[]>(getDocuments);
  const {
    mutate: postDocument,
    request: { isLoading: isCreating },
  } = useAsyncMutation<ICreateJobDocumentInput, TDocumentResponse>(postDocumentFields);
  const {
    mutate: putDocument,
    request: { isLoading: isUpdating },
  } = useAsyncMutation<IUpdateJobDocumentInput, TDocumentResponse>(putDocumentFields);
  const {
    mutate: removeDocument,
    request: { isLoading: isDeleting },
  } = useAsyncMutation<IDeleteJobDocumentInput, void>(removeDocumentFields);

  /**
   * Tracked here rather than derived from the three mutations' own error
   * states, for the same reason `useJobNotes` does: each of those only
   * clears when that same mutation runs again, so a failed create followed
   * by a successful update would otherwise still show the create's stale
   * error.
   */
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  /**
   * Tracks which documents' updates/deletes are in flight, so `aria-busy` on
   * a document row can name that row specifically instead of every row
   * sharing `isMutating`. A set rather than a single id: rows other than
   * the busy one stay enabled, so two rows can be saving at once, and a
   * single id would let the first one to finish clear the other's marker
   * while it is still in flight.
   */
  const [updatingDocumentIds, setUpdatingDocumentIds] = useState(noDocumentIds);
  const [deletingDocumentIds, setDeletingDocumentIds] = useState(noDocumentIds);

  /**
   * The last list this job loaded successfully. `useAsyncMutation` clears
   * `data` the moment a reload starts, so without this every write's
   * reload would briefly empty the list and swap the panel to its loading
   * state, unmounting every row and discarding any edit the user has open
   * in a row other than the one that was written. Keyed by job so a
   * different job never shows this one's documents.
   */
  const [lastLoaded, setLastLoaded] = useState<{
    documents: TDocumentResponse[];
    jobId: string;
  } | null>(null);

  /**
   * Numbers each reload so only the latest one may replace `lastLoaded`.
   * `useAsyncMutation` already ignores a stale response for its own
   * `data`, but still resolves the caller's promise with it; without this
   * check, two overlapping reloads landing out of order would cache the
   * older list, which the panel then falls back to during the next reload.
   */
  const latestReloadIdRef = useRef(0);

  /**
   * Reloads the list and resolves once the reload has settled. It never
   * rejects: a failed reload is recorded in `loadError` and rendered from
   * there, so a write that awaits it still counts as successful.
   */
  const refreshDocuments = useCallback((): Promise<void> => {
    latestReloadIdRef.current += 1;
    const reloadId = latestReloadIdRef.current;

    return loadDocuments(jobId).then(
      (documents) => {
        if (reloadId === latestReloadIdRef.current) setLastLoaded({ documents, jobId });
      },
      () => {
        // Error is already recorded in request state and rendered from it.
      },
    );
  }, [jobId, loadDocuments]);

  const reload = useCallback(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * Prefers the request's own `data`, which `useAsyncMutation` guards
   * against stale responses, and falls back to the last loaded list while
   * a reload is in flight or after one has failed.
   */
  const loadedDocuments = Array.isArray(data)
    ? data
    : lastLoaded?.jobId === jobId
      ? lastLoaded.documents
      : null;

  const documents = useMemo(
    () => (loadedDocuments ? loadedDocuments.map(mapDocumentResponseToJobDocument) : []),
    [loadedDocuments],
  );

  /**
   * Applies the success/error contract every one of the three writes
   * shares: clear the previous mutation error and reload on success, or
   * record the new error and re-throw on failure. A successful write
   * resolves only once its reload has settled, so a caller that closes an
   * edit row or resets a form on success never shows the pre-write list
   * in the meantime.
   *
   * Before that refresh starts, the confirmed write is applied to the
   * cached list through `applyToList`, so the list the panel falls back
   * to - during the refresh, or after it fails - already reflects it. A
   * failed refresh otherwise left a deleted document on screen with
   * working buttons, or a saved row showing its old values. Extracted so that
   * shared contract lives in exactly one place instead of being repeated
   * once per write, where a future change to it (or a slip while making
   * one) could silently leave the three writes disagreeing about what
   * they promise.
   *
   * @param {Promise<T>} request The in-flight create/update/delete request.
   * @param {(documents: TDocumentResponse[], result: T) => TDocumentResponse[]} applyToList
   *   Applies the write's confirmed result to the cached list.
   * @returns {Promise<void>} Resolves on success; rejects with the same error on failure.
   */
  const settleMutation = useCallback(
    <T>(
      request: Promise<T>,
      applyToList: (documents: TDocumentResponse[], result: T) => TDocumentResponse[],
    ): Promise<void> =>
      request.then(
        (result) => {
          setMutationError(null);
          setLastLoaded((current) =>
            current?.jobId === jobId
              ? { documents: applyToList(current.documents, result), jobId }
              : current,
          );

          return refreshDocuments();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      ),
    [jobId, refreshDocuments],
  );

  /**
   * Drops any entry with the created document's id before appending it: a
   * reload started by another write can land first and already include
   * the new document, and appending it again would list it twice.
   */
  const createJobDocument = useCallback(
    (values: IDocumentFormValues) =>
      settleMutation(postDocument({ jobId, values }), (documents, created) => [
        ...documents.filter((document) => document.id !== created.id),
        created,
      ]),
    [jobId, postDocument, settleMutation],
  );

  const updateJobDocument = useCallback(
    (documentId: string, values: IDocumentFormValues) => {
      setUpdatingDocumentIds((ids) => toggleDocumentId(ids, documentId, true));

      return settleMutation(putDocument({ documentId, jobId, values }), (documents, updated) =>
        documents.map((document) => (document.id === updated.id ? updated : document)),
      ).finally(() => setUpdatingDocumentIds((ids) => toggleDocumentId(ids, documentId, false)));
    },
    [jobId, putDocument, settleMutation],
  );

  const deleteJobDocument = useCallback(
    (documentId: string) => {
      setDeletingDocumentIds((ids) => toggleDocumentId(ids, documentId, true));

      return settleMutation(removeDocument({ documentId, jobId }), (documents) =>
        documents.filter((document) => document.id !== documentId),
      ).finally(() => setDeletingDocumentIds((ids) => toggleDocumentId(ids, documentId, false)));
    },
    [jobId, removeDocument, settleMutation],
  );

  return {
    documents,
    createJobDocument,
    deleteJobDocument,
    deletingDocumentIds,
    hasLoadedDocuments: loadedDocuments !== null,
    isCreating,
    isLoading: (isIdle || isLoading) && !loadedDocuments,
    isMutating: isCreating || isUpdating || isDeleting,
    loadError,
    mutationError,
    reload,
    updateJobDocument,
    updatingDocumentIds,
  };
};
