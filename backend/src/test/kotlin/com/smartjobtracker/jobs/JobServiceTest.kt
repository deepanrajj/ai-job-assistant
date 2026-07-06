package com.smartjobtracker.jobs

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.jobs.command.CreateJobCommand
import com.smartjobtracker.jobs.command.UpdateJobCommand
import com.smartjobtracker.testsupport.api.assertApiException
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.catchThrowableOfType
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Clock
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@SpringBootTest
@Transactional
class JobServiceTest {
    @Autowired
    lateinit var jobRepository: JobRepository

    private val fixedClock: Clock = Clock.fixed(Instant.parse("2026-07-05T12:00:00Z"), ZoneOffset.UTC)

    private val expectedNow: OffsetDateTime = OffsetDateTime.now(fixedClock)

    private lateinit var jobService: JobService

    @BeforeEach
    fun setUp() {
        jobService = DefaultJobService(jobRepository, fixedClock)
    }

    private fun seedJob(
        company: String = "Seeded Corp",
        updatedAt: OffsetDateTime = expectedNow.minusDays(10),
    ): Job =
        jobRepository.save(
            Job(
                id = UUID.randomUUID(),
                userId = UUID.randomUUID(),
                company = company,
                roleTitle = "Seeded Engineer",
                location = "Berlin",
                status = JobStatus.APPLIED,
                jobUrl = "https://example.com/jobs/seeded",
                salaryMin = BigDecimal("50000.00"),
                salaryMax = BigDecimal("70000.00"),
                description = "Seeded description.",
                createdAt = updatedAt,
                updatedAt = updatedAt,
            ),
        )

    @Test
    fun `lists jobs ordered by most recently updated first`() {
        seedJob(company = "Middle", updatedAt = expectedNow.minusDays(2))
        seedJob(company = "Newest", updatedAt = expectedNow.minusDays(1))
        seedJob(company = "Oldest", updatedAt = expectedNow.minusDays(3))

        val companies = jobService.listJobs().map { it.company }

        assertThat(companies).containsExactly("Newest", "Middle", "Oldest")
    }

    @Test
    fun `returns a job by id`() {
        val seeded = seedJob()

        val found = jobService.getJob(seeded.id)

        assertThat(found.id).isEqualTo(seeded.id)
        assertThat(found.company).isEqualTo(seeded.company)
    }

    @Test
    fun `throws job not found when reading a missing job`() {
        val exception = catchThrowableOfType(ApiException::class.java) { jobService.getJob(UUID.randomUUID()) }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `creates a job with defaults from a minimal command`() {
        val created = jobService.createJob(CreateJobCommand(company = "Acme Corp", roleTitle = "Backend Engineer"))

        assertThat(created.company).isEqualTo("Acme Corp")
        assertThat(created.roleTitle).isEqualTo("Backend Engineer")
        assertThat(created.status).isEqualTo(JobStatus.WISHLIST)
        assertThat(created.userId).isNull()
        assertThat(created.location).isNull()
        assertThat(created.jobUrl).isNull()
        assertThat(created.salaryMin).isNull()
        assertThat(created.salaryMax).isNull()
        assertThat(created.description).isNull()
        assertThat(created.createdAt).isEqualTo(expectedNow)
        assertThat(created.updatedAt).isEqualTo(expectedNow)
        assertThat(jobRepository.existsById(created.id)).isTrue()
    }

    @Test
    fun `creates a job with all editable fields from a full command`() {
        val created =
            jobService.createJob(
                CreateJobCommand(
                    company = "Acme Corp",
                    roleTitle = "Backend Engineer",
                    status = JobStatus.INTERVIEW,
                    location = "Remote",
                    jobUrl = "https://example.com/jobs/1",
                    salaryMin = BigDecimal("90000.00"),
                    salaryMax = BigDecimal("120000.00"),
                    description = "Build and maintain backend services.",
                ),
            )

        assertThat(created.status).isEqualTo(JobStatus.INTERVIEW)
        assertThat(created.location).isEqualTo("Remote")
        assertThat(created.jobUrl).isEqualTo("https://example.com/jobs/1")
        assertThat(created.salaryMin).isEqualByComparingTo("90000.00")
        assertThat(created.salaryMax).isEqualByComparingTo("120000.00")
        assertThat(created.description).isEqualTo("Build and maintain backend services.")
    }

    @Test
    fun `updates editable fields and preserves identity and creation time`() {
        val seeded = seedJob()

        val updated =
            jobService.updateJob(
                seeded.id,
                UpdateJobCommand(
                    company = "New Corp",
                    roleTitle = "Staff Engineer",
                    status = JobStatus.OFFER,
                    location = null,
                    jobUrl = null,
                    salaryMin = null,
                    salaryMax = null,
                    description = "Updated description.",
                ),
            )

        assertThat(updated.id).isEqualTo(seeded.id)
        assertThat(updated.userId).isEqualTo(seeded.userId)
        assertThat(updated.createdAt).isEqualTo(seeded.createdAt)
        assertThat(updated.company).isEqualTo("New Corp")
        assertThat(updated.roleTitle).isEqualTo("Staff Engineer")
        assertThat(updated.status).isEqualTo(JobStatus.OFFER)
        assertThat(updated.location).isNull()
        assertThat(updated.jobUrl).isNull()
        assertThat(updated.salaryMin).isNull()
        assertThat(updated.salaryMax).isNull()
        assertThat(updated.description).isEqualTo("Updated description.")
        assertThat(updated.updatedAt).isEqualTo(expectedNow)
    }

    @Test
    fun `throws job not found when updating a missing job`() {
        val command =
            UpdateJobCommand(
                company = "New Corp",
                roleTitle = "Staff Engineer",
                status = JobStatus.OFFER,
                location = null,
                jobUrl = null,
                salaryMin = null,
                salaryMax = null,
                description = null,
            )

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                jobService.updateJob(UUID.randomUUID(), command)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `deletes a job`() {
        val seeded = seedJob()

        jobService.deleteJob(seeded.id)

        assertThat(jobRepository.existsById(seeded.id)).isFalse()
    }

    @Test
    fun `throws job not found when deleting a missing job`() {
        val exception = catchThrowableOfType(ApiException::class.java) { jobService.deleteJob(UUID.randomUUID()) }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }
}
