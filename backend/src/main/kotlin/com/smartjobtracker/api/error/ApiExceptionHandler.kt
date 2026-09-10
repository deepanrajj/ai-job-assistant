package com.smartjobtracker.api.error

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(ApiException::class)
    fun handleApiException(exception: ApiException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity
            .status(exception.status)
            .body(
                ApiErrorResponse(
                    code = exception.errorCode.value,
                    message = exception.message,
                ),
            )

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(exception: MethodArgumentNotValidException): ResponseEntity<ApiErrorResponse> {
        val fieldErrors =
            exception.bindingResult.fieldErrors.map { fieldError ->
                ApiFieldError(
                    field = fieldError.field,
                    message = fieldError.defaultMessage ?: "Invalid value",
                )
            }

        return ResponseEntity
            .badRequest()
            .body(
                ApiErrorResponse(
                    code = ApiErrorCode.VALIDATION_FAILED.value,
                    message = "Request validation failed.",
                    fieldErrors = fieldErrors,
                ),
            )
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleMalformedRequest(): ResponseEntity<ApiErrorResponse> =
        ResponseEntity
            .badRequest()
            .body(
                ApiErrorResponse(
                    code = ApiErrorCode.MALFORMED_REQUEST.value,
                    message = "Request body is invalid.",
                ),
            )

    /**
     * A path variable that cannot be converted to its declared type, such as a
     * `/jobs/{id}` segment that is not a UUID.
     *
     * Spring converts path variables during argument resolution, before the
     * handler method runs, so the controller never sees these. Without this
     * handler they reach the catch-all below and are reported as 500, which
     * blames the server for a malformed request.
     *
     * The rejected value is deliberately not echoed back: it is caller-supplied
     * text, and every other handler here answers with a fixed message.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handlePathParameterTypeMismatch(): ResponseEntity<ApiErrorResponse> =
        ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ApiErrorResponse(
                    code = ApiErrorCode.INVALID_PATH_PARAMETER.value,
                    message = "Path parameter is invalid.",
                ),
            )

    @ExceptionHandler(Exception::class)
    fun handleUnexpectedException(): ResponseEntity<ApiErrorResponse> =
        ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(
                ApiErrorResponse(
                    code = ApiErrorCode.INTERNAL_ERROR.value,
                    message = "Unexpected server error.",
                ),
            )
}
