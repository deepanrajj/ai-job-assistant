package com.smartjobtracker.jobs.dto

import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.jobs.command.UpdateJobCommand
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal

/**
 * Update request payload. An update replaces every editable field, so no
 * field carries a default. `status` is nullable only so an omitted value
 * is reported as a validation error instead of a malformed request.
 */
data class UpdateJobRequest(
    @field:NotBlank("Company must not be blank")
    @field:Size(max = MAX_SHORT_TEXT_LENGTH, message = "Company must be at most 255 characters")
    val company: String,
    @field:NotBlank("Role title must not be blank")
    @field:Size(max = MAX_SHORT_TEXT_LENGTH, message = "Role title must be at most 255 characters")
    val roleTitle: String,
    @field:Size(max = MAX_SHORT_TEXT_LENGTH, message = "Location must be at most 255 characters")
    val location: String?,
    @field:NotNull("Status must not be null")
    val status: JobStatus?,
    @field:Size(max = MAX_URL_LENGTH, message = "Job URL must be at most 2048 characters")
    val jobUrl: String?,
    @field:Digits(
        integer = MAX_SALARY_INTEGER_DIGITS,
        fraction = MAX_SALARY_FRACTION_DIGITS,
        message = "Minimum salary must have at most 10 digits and 2 decimal places",
    )
    val salaryMin: BigDecimal?,
    @field:Digits(
        integer = MAX_SALARY_INTEGER_DIGITS,
        fraction = MAX_SALARY_FRACTION_DIGITS,
        message = "Maximum salary must have at most 10 digits and 2 decimal places",
    )
    val salaryMax: BigDecimal?,
    val description: String?,
)

fun UpdateJobRequest.toCommand(): UpdateJobCommand =
    UpdateJobCommand(
        company = company,
        roleTitle = roleTitle,
        location = location,
        status = requireNotNull(status) { "Status must not be null" },
        jobUrl = jobUrl,
        salaryMin = salaryMin,
        salaryMax = salaryMax,
        description = description,
    )
