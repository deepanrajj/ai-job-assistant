package com.smartjobtracker.jobs.dto

import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.jobs.command.CreateJobCommand
import jakarta.validation.constraints.NotBlank
import java.math.BigDecimal

/**
 * Create request payload. `status` is optional so an omitted value keeps
 * the `CreateJobCommand` default instead of restating it here.
 */
data class CreateJobRequest(
    @field:NotBlank("Company must not be blank")
    val company: String,
    @field:NotBlank("Role title must not be blank")
    val roleTitle: String,
    val location: String? = null,
    val status: JobStatus? = null,
    val jobUrl: String? = null,
    val salaryMin: BigDecimal? = null,
    val salaryMax: BigDecimal? = null,
    val description: String? = null,
)

fun CreateJobRequest.toCommand(): CreateJobCommand {
    val command =
        CreateJobCommand(
            company = company,
            roleTitle = roleTitle,
            location = location,
            jobUrl = jobUrl,
            salaryMin = salaryMin,
            salaryMax = salaryMax,
            description = description,
        )

    return if (status == null) command else command.copy(status = status)
}
