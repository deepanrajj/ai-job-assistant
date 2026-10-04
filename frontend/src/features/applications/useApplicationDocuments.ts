import { useCallback, useEffect, useMemo } from 'react';

import {
  getAllApplicationDocuments,
  mapDocumentResponseToJobDocument,
  type TApplicationDocumentResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';
import type { TApplicationDocument } from './applications.types';

/**
 * Application documents state returned by useApplicationDocuments.
 */
export interface IApplicationDocumentsState {
  documents: TApplicationDocument[];
  error: AppError | null;
  isLoading: boolean;
  reload: () => void;
}

/**
 * Loads every job's documents in one request for the Applications page.
 *
 * @returns {IApplicationDocumentsState} Documents with their job ids, load error, loading flag, and retry.
 */
export const useApplicationDocuments = (): IApplicationDocumentsState => {
  const {
    mutate: loadDocuments,
    request: { data, error, isIdle, isLoading },
  } = useAsyncMutation<void, TApplicationDocumentResponse[]>(getAllApplicationDocuments);

  const reload = useCallback(() => {
    loadDocuments().catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [loadDocuments]);

  useEffect(() => {
    reload();
  }, [reload]);

  const documents = useMemo(
    () =>
      Array.isArray(data)
        ? data.map((response) => ({
            ...mapDocumentResponseToJobDocument(response),
            jobId: response.jobId,
          }))
        : [],
    [data],
  );

  return {
    documents,
    error,
    isLoading: isIdle || isLoading,
    reload,
  };
};
