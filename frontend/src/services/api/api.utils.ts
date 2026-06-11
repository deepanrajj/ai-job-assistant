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
 * Reads the backend error message when the response body contains one.
 *
 * @param {Response} response Failed fetch response.
 * @param {string} fallbackMessage Message used when the response body has no readable error.
 * @returns {Promise<string>} Backend error message or fallback message.
 */
export const getApiErrorMessage = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  try {
    const errorBody = (await response.json()) as TApiErrorResponse;
    return errorBody.error ?? errorBody.message ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

/**
 * Creates an AppError from a failed HTTP response.
 *
 * @param {Response} response Failed fetch response.
 * @param {IApiErrorOptions} options Error mapping options for the request.
 * @returns {Promise<AppError>} Display-ready API error.
 */
export const createApiError = async (
  response: Response,
  { errorCode, fallbackErrorMessage }: IApiErrorOptions,
): Promise<AppError> =>
  new AppError(await getApiErrorMessage(response, fallbackErrorMessage), errorCode);

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
