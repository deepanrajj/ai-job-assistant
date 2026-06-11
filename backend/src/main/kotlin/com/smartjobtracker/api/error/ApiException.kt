package com.smartjobtracker.api.error

import org.springframework.http.HttpStatus

class ApiException(
    val status: HttpStatus,
    val errorCode: ApiErrorCode,
    override val message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)
