package com.smartjobtracker.jobs.command

import com.smartjobtracker.jobs.JobSource
import com.smartjobtracker.jobs.JobStatus
import java.math.BigDecimal

data class CreateJobCommand(
    val company: String,
    val roleTitle: String,
    val status: JobStatus = JobStatus.WISHLIST,
    val source: JobSource? = null,
    val location: String? = null,
    val jobUrl: String? = null,
    val salaryMin: BigDecimal? = null,
    val salaryMax: BigDecimal? = null,
    val description: String? = null,
)

data class UpdateJobCommand(
    val company: String,
    val roleTitle: String,
    val status: JobStatus,
    val source: JobSource?,
    val location: String?,
    val jobUrl: String?,
    val salaryMin: BigDecimal?,
    val salaryMax: BigDecimal?,
    val description: String?,
)
