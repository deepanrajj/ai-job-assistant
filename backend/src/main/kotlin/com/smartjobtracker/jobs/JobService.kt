package com.smartjobtracker.jobs

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.jobs.command.CreateJobCommand
import com.smartjobtracker.jobs.command.UpdateJobCommand
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.OffsetDateTime
import java.util.UUID

interface JobService {
    fun listJobs(): List<Job>

    fun getJob(id: UUID): Job

    fun createJob(command: CreateJobCommand): Job

    fun updateJob(
        id: UUID,
        command: UpdateJobCommand,
    ): Job

    fun deleteJob(id: UUID)
}

@Service
class DefaultJobService(
    private val jobRepository: JobRepository,
    private val clock: Clock,
) : JobService {
    @Transactional
    override fun listJobs(): List<Job> = jobRepository.findAllByOrderByUpdatedAtDesc()

    @Transactional
    override fun getJob(id: UUID): Job = jobRepository.findById(id).orElseThrow { jobNotFound() }

    @Transactional
    override fun createJob(command: CreateJobCommand): Job {
        val timestamp = now()
        val job =
            Job(
                id = UUID.randomUUID(),
                userId = null,
                company = command.company,
                roleTitle = command.roleTitle,
                status = command.status,
                jobUrl = command.jobUrl,
                location = command.location,
                description = command.description,
                salaryMin = command.salaryMin,
                salaryMax = command.salaryMax,
                createdAt = timestamp,
                updatedAt = timestamp,
            )

        return jobRepository.save(job)
    }

    @Transactional
    override fun updateJob(
        id: UUID,
        command: UpdateJobCommand,
    ): Job {
        val existing = jobRepository.findById(id).orElseThrow { jobNotFound() }
        val updated =
            Job(
                id = existing.id,
                userId = existing.userId,
                company = command.company,
                roleTitle = command.roleTitle,
                status = command.status,
                jobUrl = command.jobUrl,
                location = command.location,
                description = command.description,
                salaryMin = command.salaryMin,
                salaryMax = command.salaryMax,
                createdAt = existing.createdAt,
                updatedAt = now(),
            )

        return jobRepository.save(updated)
    }

    @Transactional
    override fun deleteJob(id: UUID) {
        if (!jobRepository.existsById(id)) {
            throw jobNotFound()
        }
        jobRepository.deleteById(id)
    }

    private fun now(): OffsetDateTime = OffsetDateTime.now(clock)

    private fun jobNotFound(): ApiException =
        ApiException(
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
}
