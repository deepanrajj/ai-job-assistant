import { APP_ERROR_CODES, type TAppErrorCode } from '../types';

/**
 * Represents a display-ready application error used across the frontend.
 */
export class AppError extends Error {
  code: TAppErrorCode;

  constructor(message: string, code: TAppErrorCode = APP_ERROR_CODES.UNKNOWN) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
