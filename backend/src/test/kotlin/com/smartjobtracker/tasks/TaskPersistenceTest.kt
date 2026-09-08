package com.smartjobtracker.tasks

import com.smartjobtracker.jobs.Job
import com.smartjobtracker.jobs.JobStatus
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import jakarta.persistence.PersistenceException
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import java.sql.SQLException
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

@SpringBootTest
@Transactional
class TaskPersistenceTest {
    @PersistenceContext
    lateinit var entityManager: EntityManager

    private fun persistJob(): Job {
        val timestamp = OffsetDateTime.parse("2026-07-05T12:00:00Z")
        val job =
            Job(
                id = UUID.randomUUID(),
                userId = null,
                company = "Acme Corp",
                roleTitle = "Backend Engineer",
                location = "Remote",
                status = JobStatus.APPLIED,
                jobUrl = "https://example.com/jobs/1",
                salaryMin = null,
                salaryMax = null,
                description = null,
                createdAt = timestamp,
                updatedAt = timestamp,
            )
        entityManager.persist(job)

        return job
    }

    private fun newTask(
        jobId: UUID,
        dueDate: LocalDate? = LocalDate.parse("2026-08-25"),
    ): Task {
        val timestamp = OffsetDateTime.parse("2026-07-05T12:00:00Z")

        return Task(
            id = UUID.randomUUID(),
            jobId = jobId,
            title = "Prepare system design answers",
            status = TaskStatus.TODO,
            dueDate = dueDate,
            createdAt = timestamp,
            updatedAt = timestamp,
        )
    }

    @Test
    fun `persists a task and reads every column back from the tasks table`() {
        val job = persistJob()
        val task = newTask(jobId = job.id)

        entityManager.persist(task)
        entityManager.flush()
        entityManager.clear()

        val loaded = entityManager.find(Task::class.java, task.id)

        assertThat(loaded).isNotNull()
        assertThat(loaded.jobId).isEqualTo(job.id)
        assertThat(loaded.title).isEqualTo("Prepare system design answers")
        assertThat(loaded.status).isEqualTo(TaskStatus.TODO)
        assertThat(loaded.dueDate).isEqualTo(LocalDate.parse("2026-08-25"))
        assertThat(loaded.createdAt.toInstant()).isEqualTo(task.createdAt.toInstant())
        assertThat(loaded.updatedAt.toInstant()).isEqualTo(task.updatedAt.toInstant())
    }

    @Test
    fun `persists a task without a due date`() {
        val job = persistJob()
        val task = newTask(jobId = job.id, dueDate = null)

        entityManager.persist(task)
        entityManager.flush()
        entityManager.clear()

        assertThat(entityManager.find(Task::class.java, task.id).dueDate).isNull()
    }

    @Test
    fun `deleting a job deletes its tasks`() {
        val job = persistJob()
        val task = newTask(jobId = job.id)
        entityManager.persist(task)
        entityManager.flush()

        entityManager.remove(entityManager.find(Job::class.java, job.id))
        entityManager.flush()

        // JPA does not know about database-level cascades, so clear the
        // persistence context to force a fresh read rather than a cache hit.
        entityManager.clear()

        assertThat(entityManager.find(Task::class.java, task.id)).isNull()
    }

    @Test
    fun `rejects a task that references an unknown job`() {
        val task = newTask(jobId = UUID.randomUUID())

        entityManager.persist(task)

        assertThatThrownBy { entityManager.flush() }
            .isInstanceOf(PersistenceException::class.java)
            .hasRootCauseInstanceOf(SQLException::class.java)
    }

    @Test
    fun `task status round-trips through its string name`() {
        assertThat(TaskStatus.values()).isNotEmpty()
        assertThat(TaskStatus.valueOf(TaskStatus.DONE.name)).isEqualTo(TaskStatus.DONE)
    }
}
