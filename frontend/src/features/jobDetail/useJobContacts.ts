import { useCallback, useEffect, useMemo, useState } from 'react';

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
  deletingContactId: string | null;
  isCreating: boolean;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  reload: () => void;
  updateJobContact: (contactId: string, values: IContactFormValues) => Promise<void>;
  updatingContactId: string | null;
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
   * Tracks which contact's update/delete is in flight, so `aria-busy` on a
   * contact row can name that row specifically instead of every row sharing
   * `isMutating`.
   */
  const [updatingContactId, setUpdatingContactId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  const reload = useCallback(() => {
    loadContacts(jobId).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [jobId, loadContacts]);

  useEffect(() => {
    reload();
  }, [reload]);

  const contacts = useMemo(
    () => (Array.isArray(data) ? data.map(mapContactResponseToJobContact) : []),
    [data],
  );

  const createJobContact = useCallback(
    (values: IContactFormValues) =>
      postContact({ jobId, values }).then(
        () => {
          setMutationError(null);
          reload();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      ),
    [jobId, postContact, reload],
  );

  const updateJobContact = useCallback(
    (contactId: string, values: IContactFormValues) => {
      setUpdatingContactId(contactId);

      return putContact({ contactId, jobId, values })
        .then(
          () => {
            setMutationError(null);
            reload();
          },
          (error: AppError) => {
            setMutationError(error);
            throw error;
          },
        )
        .finally(() => setUpdatingContactId(null));
    },
    [jobId, putContact, reload],
  );

  const deleteJobContact = useCallback(
    (contactId: string) => {
      setDeletingContactId(contactId);

      return removeContact({ contactId, jobId })
        .then(
          () => {
            setMutationError(null);
            reload();
          },
          (error: AppError) => {
            setMutationError(error);
            throw error;
          },
        )
        .finally(() => setDeletingContactId(null));
    },
    [jobId, reload, removeContact],
  );

  return {
    contacts,
    createJobContact,
    deleteJobContact,
    deletingContactId,
    isCreating,
    isLoading: isIdle || isLoading,
    isMutating: isCreating || isUpdating || isDeleting,
    loadError,
    mutationError,
    reload,
    updateJobContact,
    updatingContactId,
  };
};
