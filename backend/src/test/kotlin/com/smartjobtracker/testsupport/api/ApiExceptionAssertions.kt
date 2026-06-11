package com.smartjobtracker.testsupport.api

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import org.springframework.http.HttpStatus
import kotlin.test.assertEquals

fun assertApiException(
    exception: ApiException,
    status: HttpStatus,
    errorCode: ApiErrorCode,
    message: String,
) {
    assertEquals(status, exception.status)
    assertEquals(errorCode, exception.errorCode)
    assertEquals(message, exception.message)
}

fun assertBadGatewayApiException(
    exception: ApiException,
    errorCode: ApiErrorCode,
    message: String,
) {
    assertApiException(
        exception = exception,
        status = HttpStatus.BAD_GATEWAY,
        errorCode = errorCode,
        message = message,
    )
}
