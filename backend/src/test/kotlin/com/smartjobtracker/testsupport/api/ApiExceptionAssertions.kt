package com.smartjobtracker.testsupport.api

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import org.assertj.core.api.Assertions.assertThat
import org.springframework.http.HttpStatus

fun assertApiException(
    exception: ApiException,
    status: HttpStatus,
    errorCode: ApiErrorCode,
    message: String,
) {
    assertThat(exception.status).isEqualTo(status)
    assertThat(exception.errorCode).isEqualTo(errorCode)
    assertThat(exception.message).isEqualTo(message)
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
