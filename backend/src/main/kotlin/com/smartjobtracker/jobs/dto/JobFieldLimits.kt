package com.smartjobtracker.jobs.dto

/**
 * Request field limits mirroring the `jobs` table columns created in
 * `V2__create_jobs_table.sql`. Keeping them aligned means oversized
 * input is rejected as a validation error instead of failing at the
 * database and surfacing as an unexpected server error.
 */
internal const val MAX_SHORT_TEXT_LENGTH = 255

internal const val MAX_URL_LENGTH = 2048

internal const val MAX_SALARY_INTEGER_DIGITS = 10

internal const val MAX_SALARY_FRACTION_DIGITS = 2
