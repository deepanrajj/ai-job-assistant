package com.smartjobtracker.jobs.dto

import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.jobs.command.UpdateJobCommand
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal

/**
 * Update request payload. An update replaces every editable field, so no
 * field carries a default. `status` is nullable only so an omitted value
 * is reported as a validation error instead of a malformed request.
 */
data class UpdateJobRequest(
    @field:NotBlank("Company must not be blank")
    val company: String,
    @field:NotBlank("Role title must not be blank")
    val roleTitle: String,
    val location: String?,
    @field:NotNull("Status must not be null")
    val status: JobStatus?,
    val jobUrl: String?,
    val salaryMin: BigDecimal?,
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
