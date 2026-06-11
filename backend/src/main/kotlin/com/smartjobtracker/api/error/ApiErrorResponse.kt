package com.smartjobtracker.api.error

data class ApiErrorResponse(
    val code: String,
    val message: String,
    val fieldErrors: List<ApiFieldError> = emptyList(),
)

data class ApiFieldError(
    val field: String,
    val message: String,
)
