package com.smartjobtracker.tasks

import com.smartjobtracker.jobs.Job
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.tasks.createTaskEntity
import com.smartjobtracker.testsupport.tasks.taskFixtureDueDate
import com.smartjobtracker.testsupport.tasks.taskFixtureTimestamp
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
class TaskPersistenceTest {
    @PersistenceContext
    lateinit var entityManager: EntityManager

    private fun persistJob(): Job {
        val job = createJobEntity()
        entityManager.persist(job)

        return job
    }

    @Test
    fun `persists a task and reads every column back from the tasks table`() {
        val job = persistJob()
        val task = createTaskEntity(jobId = job.id)

        entityManager.persist(task)
        entityManager.flush()
        entityManager.clear()

        val loaded = entityManager.find(Task::class.java, task.id)

        assertThat(loaded).isNotNull()
        assertThat(loaded.jobId).isEqualTo(job.id)
        assertThat(loaded.title).isEqualTo("Prepare system design answers")
        assertThat(loaded.status).isEqualTo(TaskStatus.TODO)
        assertThat(loaded.dueDate).isEqualTo(taskFixtureDueDate)
        assertThat(loaded.createdAt.toInstant()).isEqualTo(taskFixtureTimestamp.toInstant())
        assertThat(loaded.updatedAt.toInstant()).isEqualTo(taskFixtureTimestamp.toInstant())
    }

    @Test
    fun `persists a task without a due date`() {
        val job = persistJob()
        val task = createTaskEntity(jobId = job.id, dueDate = null)

        entityManager.persist(task)
        entityManager.flush()
        entityManager.clear()

        assertThat(entityManager.find(Task::class.java, task.id).dueDate).isNull()
    }

    @Test
    fun `deleting a job deletes its tasks`() {
        val job = persistJob()
        val task = createTaskEntity(jobId = job.id)
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
        val task = createTaskEntity(jobId = UUID.randomUUID())

        entityManager.persist(task)

        assertThatThrownBy { entityManager.flush() }
            .isInstanceOf(PersistenceException::class.java)
            .hasRootCauseInstanceOf(SQLException::class.java)
    }

    @Test
    fun `task status round-trips through its string name`() {
        // Pinned to the frontend's TJobTaskStatus union, so adding or
        // renaming a constant here fails until both sides agree.
        assertThat(TaskStatus.entries).containsExactly(TaskStatus.TODO, TaskStatus.DONE)
        assertThat(TaskStatus.valueOf(TaskStatus.DONE.name)).isEqualTo(TaskStatus.DONE)
    }
}
