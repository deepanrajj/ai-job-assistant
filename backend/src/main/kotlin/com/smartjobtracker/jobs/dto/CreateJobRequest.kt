package com.smartjobtracker.jobs.dto

import com.smartjobtracker.jobs.JobSource
import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.jobs.command.CreateJobCommand
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.math.BigDecimal

/**
 * Create request payload. `status` is optional so an omitted value keeps
 * the `CreateJobCommand` default instead of restating it here.
 */
data class CreateJobRequest(
    @field:NotBlank("Company must not be blank")
    @field:Size(max = MAX_SHORT_TEXT_LENGTH, message = "Company must be at most 255 characters")
    val company: String,
    @field:NotBlank("Role title must not be blank")
    @field:Size(max = MAX_SHORT_TEXT_LENGTH, message = "Role title must be at most 255 characters")
    val roleTitle: String,
    @field:Size(max = MAX_SHORT_TEXT_LENGTH, message = "Location must be at most 255 characters")
    val location: String? = null,
    val status: JobStatus? = null,
    val source: JobSource? = null,
    @field:Size(max = MAX_URL_LENGTH, message = "Job URL must be at most 2048 characters")
    val jobUrl: String? = null,
    @field:Digits(
        integer = MAX_SALARY_INTEGER_DIGITS,
        fraction = MAX_SALARY_FRACTION_DIGITS,
        message = "Minimum salary must have at most 10 digits and 2 decimal places",
    )
    val salaryMin: BigDecimal? = null,
    @field:Digits(
        integer = MAX_SALARY_INTEGER_DIGITS,
        fraction = MAX_SALARY_FRACTION_DIGITS,
        message = "Maximum salary must have at most 10 digits and 2 decimal places",
    )
    val salaryMax: BigDecimal? = null,
    val description: String? = null,
)

fun CreateJobRequest.toCommand(): CreateJobCommand =
    CreateJobCommand(
        company = company,
        roleTitle = roleTitle,
        status = status ?: JobStatus.WISHLIST,
        source = source,
        location = location,
        jobUrl = jobUrl,
        salaryMin = salaryMin,
        salaryMax = salaryMax,
        description = description,
    )
