package com.smartjobtracker.api.error

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

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
