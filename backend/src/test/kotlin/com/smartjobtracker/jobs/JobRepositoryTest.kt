package com.smartjobtracker.jobs

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.time.temporal.ChronoUnit
import java.util.UUID

@SpringBootTest
@Transactional
class JobRepositoryTest {
    @Autowired
    lateinit var jobRepository: JobRepository

    private fun createJob(
        company: String,
        updatedAt: OffsetDateTime,
        id: UUID = UUID.randomUUID(),
    ): Job =
        Job(
            id = id,
            company = company,
            updatedAt = updatedAt,
            createdAt = updatedAt,
            status = JobStatus.OFFER,
            roleTitle = "Fullstack Engineer",
            location = null,
            description = null,
            jobUrl = null,
            userId = UUID.randomUUID(),
            salaryMax = null,
            salaryMin = null,
        )

    @Test
    fun `returns jobs ordered by most recently updated first`() {
        val baseTime = OffsetDateTime.now().truncatedTo(ChronoUnit.MICROS)
        val jobOldest = createJob(company = "Oldest", updatedAt = baseTime.minusDays(3))
        jobRepository.save(jobOldest)
        val jobNewest = createJob(company = "Newest", updatedAt = baseTime.minusDays(1))
        jobRepository.save(jobNewest)
        val jobMiddle = createJob(company = "Middle", updatedAt = baseTime.minusDays(2))
        jobRepository.save(jobMiddle)
        val companies = jobRepository.findAllByOrderByUpdatedAtDescIdAsc().map { it.company }

        assertThat(companies).containsExactly("Newest", "Middle", "Oldest")
    }

    @Test
    fun `orders jobs sharing an updated instant by id`() {
        val sharedInstant = OffsetDateTime.now().truncatedTo(ChronoUnit.MICROS)
        val firstId = UUID.fromString("11111111-1111-1111-1111-111111111111")
        val secondId = UUID.fromString("22222222-2222-2222-2222-222222222222")
        jobRepository.save(createJob(company = "Second", updatedAt = sharedInstant, id = secondId))
        jobRepository.save(createJob(company = "First", updatedAt = sharedInstant, id = firstId))

        val companies = jobRepository.findAllByOrderByUpdatedAtDescIdAsc().map { it.company }

        assertThat(companies).containsExactly("First", "Second")
    }
}
