import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildContactRequestPayload,
  createContact,
  deleteContact,
  getContacts,
  mapContactResponseToJobContact,
  updateContact,
  type IContactFormValues,
  type TContactResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';
import type { TJobContact } from '../../types';

/**
 * Arguments accepted by the contact creation mutation.
 */
interface ICreateJobContactInput {
  jobId: string;
  values: IContactFormValues;
}

/**
 * Arguments accepted by the contact update mutation.
 */
interface IUpdateJobContactInput {
  contactId: string;
  jobId: string;
  values: IContactFormValues;
}

/**
 * Arguments accepted by the contact delete mutation.
 */
interface IDeleteJobContactInput {
  contactId: string;
  jobId: string;
}

/**
 * Job contacts state returned by useJobContacts.
 *
 * `createJobContact`, `updateJobContact`, and `deleteJobContact` all reject
 * when their write fails, after `mutationError` is already set, matching
 * the contract `useJobNotes` settled on for its own three writes: a caller
 * that needs to react to the outcome can await and catch, and one that
 * does not can ignore the rejection and rely on `mutationError` alone.
 */
export interface IJobContactsState {
  contacts: TJobContact[];
  createJobContact: (values: IContactFormValues) => Promise<void>;
  deleteJobContact: (contactId: string) => Promise<void>;
  deletingContactIds: ReadonlySet<string>;
  /**
   * True once this job has a list to show, even when the latest reload
   * failed, so a failed refresh can be reported without hiding the list.
   */
  hasLoadedContacts: boolean;
  isCreating: boolean;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  reload: () => void;
  updateJobContact: (contactId: string, values: IContactFormValues) => Promise<void>;
  updatingContactIds: ReadonlySet<string>;
}

/**
 * Declared at module level so each mutation's identity stays stable across
 * renders, as `useJobNotes` does for its own three writes: `useAsyncMutation`
 * keys `mutate` on the mutation function, and a closure built inside the
 * hook body would get a new identity on every render.
 */
const postContactFields = ({ jobId, values }: ICreateJobContactInput): Promise<TContactResponse> =>
  createContact(jobId, buildContactRequestPayload(values));

const putContactFields = ({
  contactId,
  jobId,
  values,
}: IUpdateJobContactInput): Promise<TContactResponse> =>
  updateContact(jobId, contactId, buildContactRequestPayload(values));

const removeContactFields = ({ contactId, jobId }: IDeleteJobContactInput): Promise<void> =>
  deleteContact(jobId, contactId);

/**
 * Returns a copy of `ids` with `id` added or removed, for use as a state
 * updater so overlapping writes each change only their own entry.
 *
 * @param {ReadonlySet<string>} ids Current set of busy contact ids.
 * @param {string} id Contact id to add or remove.
 * @param {boolean} isBusy Whether the id should be in the result.
 * @returns {ReadonlySet<string>} Updated set of busy contact ids.
 */
const toggleContactId = (
  ids: ReadonlySet<string>,
  id: string,
  isBusy: boolean,
): ReadonlySet<string> => {
  const next = new Set(ids);

  if (isBusy) next.add(id);
  else next.delete(id);

  return next;
};

const noContactIds: ReadonlySet<string> = new Set();

/**
 * Loads a job's contacts from the backend and offers create, update, and
 * delete against the same job.
 *
 * Every write reloads the list from the server rather than patching it
 * locally, matching `useJobNotes`: optimistic updates are out of scope for
 * task 039. `createJobContact` and `updateJobContact` both take the raw
 * form values and build the request payload themselves, through
 * `buildContactRequestPayload`, so a blank optional field is turned into
 * `null` in exactly one place regardless of which caller triggers it.
 *
 * @param {string} jobId Job identifier the contacts belong to.
 * @returns {IJobContactsState} Loaded contacts, request state, and the three writes.
 */
export const useJobContacts = (jobId: string): IJobContactsState => {
  const {
    mutate: loadContacts,
    request: { data, error: loadError, isIdle, isLoading },
  } = useAsyncMutation<string, TContactResponse[]>(getContacts);
  const {
    mutate: postContact,
    request: { isLoading: isCreating },
  } = useAsyncMutation<ICreateJobContactInput, TContactResponse>(postContactFields);
  const {
    mutate: putContact,
    request: { isLoading: isUpdating },
  } = useAsyncMutation<IUpdateJobContactInput, TContactResponse>(putContactFields);
  const {
    mutate: removeContact,
    request: { isLoading: isDeleting },
  } = useAsyncMutation<IDeleteJobContactInput, void>(removeContactFields);

  /**
   * Tracked here rather than derived from the three mutations' own error
   * states, for the same reason `useJobNotes` does: each of those only
   * clears when that same mutation runs again, so a failed create followed
   * by a successful update would otherwise still show the create's stale
   * error.
   */
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  /**
   * Tracks which contacts' updates/deletes are in flight, so `aria-busy` on
   * a contact row can name that row specifically instead of every row
   * sharing `isMutating`. A set rather than a single id: rows other than
   * the busy one stay enabled, so two rows can be saving at once, and a
   * single id would let the first one to finish clear the other's marker
   * while it is still in flight.
   */
  const [updatingContactIds, setUpdatingContactIds] = useState(noContactIds);
  const [deletingContactIds, setDeletingContactIds] = useState(noContactIds);

  /**
   * The last list this job loaded successfully. `useAsyncMutation` clears
   * `data` the moment a reload starts, so without this every write's
   * reload would briefly empty the list and swap the panel to its loading
   * state, unmounting every row and discarding any edit the user has open
   * in a row other than the one that was written. Keyed by job so a
   * different job never shows this one's contacts.
   */
  const [lastLoaded, setLastLoaded] = useState<{
    contacts: TContactResponse[];
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
  const refreshContacts = useCallback((): Promise<void> => {
    latestReloadIdRef.current += 1;
    const reloadId = latestReloadIdRef.current;

    return loadContacts(jobId).then(
      (contacts) => {
        if (reloadId === latestReloadIdRef.current) setLastLoaded({ contacts, jobId });
      },
      () => {
        // Error is already recorded in request state and rendered from it.
      },
    );
  }, [jobId, loadContacts]);

  const reload = useCallback(() => {
    void refreshContacts();
  }, [refreshContacts]);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * Prefers the request's own `data`, which `useAsyncMutation` guards
   * against stale responses, and falls back to the last loaded list while
   * a reload is in flight or after one has failed.
   */
  const loadedContacts = Array.isArray(data)
    ? data
    : lastLoaded?.jobId === jobId
      ? lastLoaded.contacts
      : null;

  const contacts = useMemo(
    () => (loadedContacts ? loadedContacts.map(mapContactResponseToJobContact) : []),
    [loadedContacts],
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
   * failed refresh otherwise left a deleted contact on screen with
   * working buttons, or a saved row showing its old values. Extracted so that
   * shared contract lives in exactly one place instead of being repeated
   * once per write, where a future change to it (or a slip while making
   * one) could silently leave the three writes disagreeing about what
   * they promise.
   *
   * @param {Promise<T>} request The in-flight create/update/delete request.
   * @param {(contacts: TContactResponse[], result: T) => TContactResponse[]} applyToList
   *   Applies the write's confirmed result to the cached list.
   * @returns {Promise<void>} Resolves on success; rejects with the same error on failure.
   */
  const settleMutation = useCallback(
    <T>(
      request: Promise<T>,
      applyToList: (contacts: TContactResponse[], result: T) => TContactResponse[],
    ): Promise<void> =>
      request.then(
        (result) => {
          setMutationError(null);
          setLastLoaded((current) =>
            current?.jobId === jobId
              ? { contacts: applyToList(current.contacts, result), jobId }
              : current,
          );

          return refreshContacts();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      ),
    [jobId, refreshContacts],
  );

  /**
   * Drops any entry with the created contact's id before appending it: a
   * reload started by another write can land first and already include
   * the new contact, and appending it again would list it twice.
   */
  const createJobContact = useCallback(
    (values: IContactFormValues) =>
      settleMutation(postContact({ jobId, values }), (contacts, created) => [
        ...contacts.filter((contact) => contact.id !== created.id),
        created,
      ]),
    [jobId, postContact, settleMutation],
  );

  const updateJobContact = useCallback(
    (contactId: string, values: IContactFormValues) => {
      setUpdatingContactIds((ids) => toggleContactId(ids, contactId, true));

      return settleMutation(putContact({ contactId, jobId, values }), (contacts, updated) =>
        contacts.map((contact) => (contact.id === updated.id ? updated : contact)),
      ).finally(() => setUpdatingContactIds((ids) => toggleContactId(ids, contactId, false)));
    },
    [jobId, putContact, settleMutation],
  );

  const deleteJobContact = useCallback(
    (contactId: string) => {
      setDeletingContactIds((ids) => toggleContactId(ids, contactId, true));

      return settleMutation(removeContact({ contactId, jobId }), (contacts) =>
        contacts.filter((contact) => contact.id !== contactId),
      ).finally(() => setDeletingContactIds((ids) => toggleContactId(ids, contactId, false)));
    },
    [jobId, removeContact, settleMutation],
  );

  return {
    contacts,
    createJobContact,
    deleteJobContact,
    deletingContactIds,
    hasLoadedContacts: loadedContacts !== null,
    isCreating,
    isLoading: (isIdle || isLoading) && !loadedContacts,
    isMutating: isCreating || isUpdating || isDeleting,
    loadError,
    mutationError,
    reload,
    updateJobContact,
    updatingContactIds,
  };
};
