import { AppError } from '../../errors';
import {
  DEFAULT_API_HEADERS,
  JSON_API_HEADERS,
  type IApiErrorOptions,
  type IApiRequestConfig,
  type TApiErrorResponse,
} from './api.types';

/**
 * Builds the fetch options for a request and adds JSON headers only when a body exists.
 *
 * @param {IApiRequestConfig<TBody>} config Shared API request config.
 * @returns {RequestInit} Fetch options ready to pass to fetch().
 */
export const createFetchOptions = <TBody>({
  body,
  method,
}: IApiRequestConfig<TBody>): RequestInit => {
  const hasBody = body !== undefined;

  return {
    method,
    headers: hasBody ? JSON_API_HEADERS : DEFAULT_API_HEADERS,
    body: hasBody ? JSON.stringify(body) : undefined,
  };
};

/**
 * Parses a failed response's body, or answers with an empty one.
 *
 * A failure that never reached the API - a proxy 404, a gateway timeout -
 * has no body in the backend's error shape, and that absence is itself the
 * signal callers need.
 *
 * @param {Response} response Failed fetch response.
 * @returns {Promise<TApiErrorResponse>} Parsed error body, or an empty object.
 */
export const readApiErrorBody = async (response: Response): Promise<TApiErrorResponse> => {
  try {
    const body: unknown = await response.json();

    // `null`, a bare string and an array are all valid JSON, so `json()`
    // resolves and the `catch` never fires. Casting one of those to the
    // error shape makes the property reads below throw instead, which loses
    // the status and the code this error exists to carry.
    return typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as TApiErrorResponse)
      : {};
  } catch {
    return {};
  }
};

/**
 * Creates an AppError from a failed HTTP response.
 *
 * Carries both the backend's `code` and the HTTP status, and callers branch
 * on the code. That is the half which says the API meant the answer: a
 * proxy, a gateway or a routing change can reply with any status, so a 404
 * with no `code` is a request that never reached a controller rather than a
 * thing that does not exist. The status is carried for reporting, and
 * `AppError` says so.
 *
 * @param {Response} response Failed fetch response.
 * @param {IApiErrorOptions} options Error mapping options for the request.
 * @returns {Promise<AppError>} Display-ready API error.
 */
export const createApiError = async (
  response: Response,
  { errorCode, fallbackErrorMessage }: IApiErrorOptions,
): Promise<AppError> => {
  const errorBody = await readApiErrorBody(response);

  return new AppError(
    errorBody.error ?? errorBody.message ?? fallbackErrorMessage,
    errorCode,
    response.status,
    errorBody.code,
  );
};

/**
 * Creates an AppError for request failures without a displayable API response.
 *
 * @param {IApiErrorOptions} options Error mapping options for the request.
 * @returns {AppError} Display-ready request error.
 */
export const createRequestError = ({
  errorCode,
  fallbackErrorMessage,
}: IApiErrorOptions): AppError => new AppError(fallbackErrorMessage, errorCode);

/**
 * Parses successful JSON responses and supports 204 responses with no content.
 *
 * @param {Response} response Successful fetch response.
 * @returns {Promise<TResponse>} Parsed JSON response body.
 */
export const parseJsonResponse = async <TResponse>(response: Response): Promise<TResponse> => {
  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
};
