package com.smartjobtracker.jobs

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.time.temporal.ChronoUnit
import java.util.UUID

@SpringBootTest
@Transactional
class JobPersistenceTest {
    @PersistenceContext
    lateinit var entityManager: EntityManager

    @Test
    fun `persists a job and reads every column back from the jobs table`() {
        val timestamp = OffsetDateTime.now().truncatedTo(ChronoUnit.MICROS)
        val job =
            Job(
                id = UUID.randomUUID(),
                userId = UUID.randomUUID(),
                company = "Acme Corp",
                roleTitle = "Backend Engineer",
                location = "Remote",
                status = JobStatus.APPLIED,
                jobUrl = "https://example.com/jobs/1",
                salaryMin = BigDecimal("90000.00"),
                salaryMax = BigDecimal("120000.00"),
                description = "Build and maintain backend services.",
                createdAt = timestamp,
                updatedAt = timestamp,
            )

        entityManager.persist(job)
        entityManager.flush()
        entityManager.clear()

        val loaded = entityManager.find(Job::class.java, job.id)

        assertThat(loaded).isNotNull()
        assertThat(loaded.id).isEqualTo(job.id)
        assertThat(loaded.userId).isEqualTo(job.userId)
        assertThat(loaded.company).isEqualTo("Acme Corp")
        assertThat(loaded.roleTitle).isEqualTo("Backend Engineer")
        assertThat(loaded.location).isEqualTo("Remote")
        assertThat(loaded.status).isEqualTo(JobStatus.APPLIED)
        assertThat(loaded.jobUrl).isEqualTo("https://example.com/jobs/1")
        assertThat(loaded.salaryMin).isEqualByComparingTo("90000.00")
        assertThat(loaded.salaryMax).isEqualByComparingTo("120000.00")
        assertThat(loaded.description).isEqualTo("Build and maintain backend services.")
        assertThat(loaded.createdAt.toInstant()).isEqualTo(timestamp.toInstant())
        assertThat(loaded.updatedAt.toInstant()).isEqualTo(timestamp.toInstant())
    }

    @Test
    fun `job status round-trips through its string name`() {
        assertThat(JobStatus.values()).isNotEmpty()
        assertThat(JobStatus.valueOf(JobStatus.OFFER.name)).isEqualTo(JobStatus.OFFER)
    }
}
