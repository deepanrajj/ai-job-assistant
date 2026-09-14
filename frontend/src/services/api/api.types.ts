import type { TAppErrorCode } from '../../types';

/**
 * Headers sent with every API request.
 */
export const DEFAULT_API_HEADERS = {
  Accept: 'application/json',
} as const;

/**
 * Headers sent when an API request includes a JSON request body.
 */
export const JSON_API_HEADERS = {
  ...DEFAULT_API_HEADERS,
  'Content-Type': 'application/json',
} as const;

/**
 * HTTP methods supported by the shared API client.
 */
export type TApiRequestMethod = 'DELETE' | 'GET' | 'POST' | 'PUT';

/**
 * Error response shape expected from backend API endpoints.
 *
 * `code` is the backend's own classification, such as `JOB_NOT_FOUND` or
 * `VALIDATION_FAILED`. It is what separates a 404 the API meant from a 404
 * anything between the browser and the API produced, which a status alone
 * cannot tell apart.
 */
export type TApiErrorResponse = {
  code?: string;
  error?: string;
  message?: string;
};

/**
 * Options used to create display-ready AppError instances from API failures.
 */
export interface IApiErrorOptions {
  errorCode?: TAppErrorCode;
  fallbackErrorMessage: string;
}

/**
 * Full request configuration consumed by the shared API client.
 */
export interface IApiRequestConfig<TBody = undefined> extends IApiErrorOptions {
  body?: TBody;
  method: TApiRequestMethod;
}
