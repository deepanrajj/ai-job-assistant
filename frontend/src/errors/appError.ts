import { APP_ERROR_CODES, type TAppErrorCode } from '../types';

/**
 * Represents a display-ready application error used across the frontend.
 *
 * `apiCode` is the backend's own classification from the error body, such as
 * `JOB_NOT_FOUND`, and is set only when the failure came from the API
 * itself. **Branch on this**, not on the status: a proxy, a gateway or a
 * routing change can answer with any status, and reading one of those as
 * something the API said reports a request that never arrived as an answer.
 * A failure with no `apiCode` did not come from the controller.
 *
 * `status` is the HTTP status of the response that failed, and is only set
 * when there was a response to read it from. A network failure, or a body
 * that could not be parsed, leaves it undefined. It is there to be reported
 * and logged, and is deliberately not what any screen decides from.
 */
export class AppError extends Error {
  code: TAppErrorCode;

  status?: number;

  apiCode?: string;

  constructor(
    message: string,
    code: TAppErrorCode = APP_ERROR_CODES.UNKNOWN,
    status?: number,
    apiCode?: string,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.apiCode = apiCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
