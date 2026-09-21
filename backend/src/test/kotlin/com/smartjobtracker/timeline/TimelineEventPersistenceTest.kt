package com.smartjobtracker.timeline

import com.smartjobtracker.jobs.Job
import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.timeline.createTimelineEventEntity
import com.smartjobtracker.testsupport.timeline.timelineEventFixtureTimestamp
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import jakarta.persistence.PersistenceException
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import java.sql.SQLException
import java.util.UUID

@SpringBootTest
@Transactional
class TimelineEventPersistenceTest {
    @PersistenceContext
    lateinit var entityManager: EntityManager

    private fun persistJob(): Job {
        val job = createJobEntity()
        entityManager.persist(job)

        return job
    }

    @Test
    fun `persists a timeline event and reads every column back`() {
        val job = persistJob()
        val event = createTimelineEventEntity(jobId = job.id)

        entityManager.persist(event)
        entityManager.flush()
        entityManager.clear()

        val loaded = entityManager.find(TimelineEvent::class.java, event.id)

        assertThat(loaded).isNotNull()
        assertThat(loaded.jobId).isEqualTo(job.id)
        assertThat(loaded.type).isEqualTo(TimelineEventType.STATUS_CHANGE)
        assertThat(loaded.description).isEqualTo("Status changed from Wishlist to Applied.")
        assertThat(loaded.previousStatus).isEqualTo(JobStatus.WISHLIST)
        assertThat(loaded.nextStatus).isEqualTo(JobStatus.APPLIED)
        assertThat(loaded.createdAt.toInstant()).isEqualTo(timelineEventFixtureTimestamp.toInstant())
    }

    @Test
    fun `deleting a job deletes its timeline events`() {
        val job = persistJob()
        val event = createTimelineEventEntity(jobId = job.id)
        entityManager.persist(event)
        entityManager.flush()

        entityManager.remove(entityManager.find(Job::class.java, job.id))
        entityManager.flush()

        // JPA does not know about database-level cascades, so clear the
        // persistence context to force a fresh read rather than a cache hit.
        entityManager.clear()

        assertThat(entityManager.find(TimelineEvent::class.java, event.id)).isNull()
    }

    @Test
    fun `rejects a timeline event that references an unknown job`() {
        val event = createTimelineEventEntity(jobId = UUID.randomUUID())

        entityManager.persist(event)

        assertThatThrownBy { entityManager.flush() }
            .isInstanceOf(PersistenceException::class.java)
            .hasRootCauseInstanceOf(SQLException::class.java)
    }
}
