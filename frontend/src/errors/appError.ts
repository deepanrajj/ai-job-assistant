import { APP_ERROR_CODES, type TAppErrorCode } from '../types';

/**
 * Represents a display-ready application error used across the frontend.
 *
 * `status` is the HTTP status of the response that failed, and is only set
 * when there was a response to read it from. A network failure, or a body
 * that could not be parsed, leaves it undefined. Callers use it to tell
 * apart failures that mean different things on the same endpoint, such as a
 * missing job and a server error.
 */
export class AppError extends Error {
  code: TAppErrorCode;

  status?: number;

  constructor(message: string, code: TAppErrorCode = APP_ERROR_CODES.UNKNOWN, status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
