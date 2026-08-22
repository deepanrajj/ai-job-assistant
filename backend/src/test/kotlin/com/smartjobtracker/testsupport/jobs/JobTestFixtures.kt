package com.smartjobtracker.testsupport.jobs

import com.smartjobtracker.jobs.Job
import com.smartjobtracker.jobs.JobService
import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.jobs.command.CreateJobCommand
import com.smartjobtracker.jobs.command.UpdateJobCommand
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

fun createJobEntity(
    id: UUID = UUID.randomUUID(),
    company: String = "Acme Corp",
    roleTitle: String = "Backend Engineer",
    location: String? = "Remote",
    status: JobStatus = JobStatus.WISHLIST,
    jobUrl: String? = "https://example.com/jobs/1",
    salaryMin: BigDecimal? = BigDecimal("90000.00"),
    salaryMax: BigDecimal? = BigDecimal("120000.00"),
    description: String? = "Build and maintain backend services.",
): Job =
    Job(
        id = id,
        userId = null,
        company = company,
        roleTitle = roleTitle,
        location = location,
        status = status,
        jobUrl = jobUrl,
        salaryMin = salaryMin,
        salaryMax = salaryMax,
        description = description,
        createdAt = OffsetDateTime.parse("2026-07-05T12:00:00Z"),
        updatedAt = OffsetDateTime.parse("2026-07-05T12:00:00Z"),
    )

class FakeJobService : JobService {
    lateinit var lastRequestedId: UUID
    lateinit var lastCreateCommand: CreateJobCommand
    lateinit var lastUpdateId: UUID
    lateinit var lastUpdateCommand: UpdateJobCommand
    lateinit var lastDeletedId: UUID

    var listHandler: () -> List<Job> = { listOf(createJobEntity()) }

    var getHandler: (UUID) -> Job = { createJobEntity(id = it) }

    var createHandler: (CreateJobCommand) -> Job = { createJobEntity() }

    var updateHandler: (UUID, UpdateJobCommand) -> Job = { id, _ -> createJobEntity(id = id) }

    var deleteHandler: (UUID) -> Unit = { }

    override fun listJobs(): List<Job> = listHandler()

    override fun getJob(id: UUID): Job {
        lastRequestedId = id

        return getHandler(id)
    }

    override fun createJob(command: CreateJobCommand): Job {
        lastCreateCommand = command

        return createHandler(command)
    }

    override fun updateJob(
        id: UUID,
        command: UpdateJobCommand,
    ): Job {
        lastUpdateId = id
        lastUpdateCommand = command

        return updateHandler(id, command)
    }

    override fun deleteJob(id: UUID) {
        lastDeletedId = id
        deleteHandler(id)
    }
}
