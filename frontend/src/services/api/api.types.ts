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
 */
export type TApiErrorResponse = {
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
