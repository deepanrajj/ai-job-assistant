package com.smartjobtracker.jobs.dto

import com.smartjobtracker.jobs.Job
import com.smartjobtracker.jobs.JobSource
import com.smartjobtracker.jobs.JobStatus
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Public API representation of a saved job. Deliberately omits `userId`
 * so storage-only fields stay out of the HTTP contract.
 */
data class JobResponse(
    val id: UUID,
    val company: String,
    val roleTitle: String,
    val location: String?,
    val status: JobStatus,
    val source: JobSource?,
    val jobUrl: String?,
    val salaryMin: BigDecimal?,
    val salaryMax: BigDecimal?,
    val description: String?,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)

fun Job.toResponse(): JobResponse =
    JobResponse(
        id = id,
        company = company,
        roleTitle = roleTitle,
        location = location,
        status = status,
        source = source,
        jobUrl = jobUrl,
        salaryMin = salaryMin,
        salaryMax = salaryMax,
        description = description,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
