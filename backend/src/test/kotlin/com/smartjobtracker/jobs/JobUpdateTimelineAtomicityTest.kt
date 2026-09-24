package com.smartjobtracker.jobs

import com.smartjobtracker.jobs.command.UpdateJobCommand
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.timeline.TimelineEventRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.doThrow
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.bean.override.mockito.MockitoBean
import java.util.UUID

/**
 * `JobServiceTest` constructs `DefaultJobService` by hand, which
 * bypasses Spring's transactional proxy entirely, so it cannot observe
 * whether `updateJob`'s two writes (the job update and the timeline
 * event) are genuinely atomic. This class uses the real, container-
 * managed `JobService` bean instead, and is deliberately **not**
 * `@Transactional` at the class level, so `updateJob`'s own
 * `@Transactional` boundary is the only transaction involved and its
 * rollback is real rather than nested inside a test transaction that
 * would roll back regardless of what happens inside.
 */
@SpringBootTest
class JobUpdateTimelineAtomicityTest {
    @Autowired
    lateinit var jobService: JobService

    @Autowired
    lateinit var jobRepository: JobRepository

    @MockitoBean
    lateinit var timelineEventRepository: TimelineEventRepository

    private var seededJobId: UUID? = null

    @AfterEach
    fun tearDown() {
        seededJobId?.let { jobRepository.deleteById(it) }
    }

    @Test
    fun `rolls back the job update when the timeline event write fails`() {
        val seeded = jobRepository.save(createJobEntity(status = JobStatus.APPLIED))
        seededJobId = seeded.id
        doThrow(RuntimeException("simulated write failure")).`when`(timelineEventRepository).save(any())

        assertThatThrownBy {
            jobService.updateJob(
                seeded.id,
                UpdateJobCommand(
                    company = seeded.company,
                    roleTitle = seeded.roleTitle,
                    status = JobStatus.INTERVIEW,
                    source = seeded.source,
                    location = seeded.location,
                    jobUrl = seeded.jobUrl,
                    salaryMin = seeded.salaryMin,
                    salaryMax = seeded.salaryMax,
                    description = seeded.description,
                ),
            )
        }.isInstanceOf(RuntimeException::class.java)

        val reloaded = jobRepository.findById(seeded.id).orElseThrow()

        assertThat(reloaded.status).isEqualTo(JobStatus.APPLIED)
    }
}
