package com.smartjobtracker.persistence

import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.tasks.TaskRepository
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.tasks.createTaskEntity
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.hibernate.SessionFactory
import org.hibernate.stat.Statistics
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.dao.DuplicateKeyException
import org.springframework.data.domain.Persistable
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Regression coverage for bug 001.
 *
 * Entities carry an id assigned by the service, so Spring Data's default
 * "the id is null, therefore it is new" rule never fires and every save
 * used to take the `merge` path: a wasted `SELECT` before the `INSERT`,
 * and a managed copy handed back instead of the caller's own object.
 *
 * Statement counts come from Hibernate's `Statistics` rather than from
 * reading a SQL log, so the absence of that `SELECT` is an assertion a
 * build can fail on.
 */
@SpringBootTest
@Transactional
class AssignedIdEntityTest {
    @PersistenceContext
    lateinit var entityManager: EntityManager

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var taskRepository: TaskRepository

    /**
     * `Statistics` is Hibernate's, not JPA's, so there is no standard way
     * to reach it. `unwrap` is JPA's own escape hatch to the underlying
     * implementation.
     */
    private fun statistics(): Statistics =
        entityManager.entityManagerFactory
            .unwrap(SessionFactory::class.java)
            .statistics

    @Test
    fun `saving a new job inserts it without loading it first`() {
        val job = createJobEntity()
        val statistics = statistics()
        statistics.clear()

        jobRepository.save(job)
        // Nothing reaches the database until the queued writes are
        // flushed, and this test rolls back rather than committing.
        entityManager.flush()

        assertThat(statistics.prepareStatementCount).isEqualTo(1)
        assertThat(statistics.entityInsertCount).isEqualTo(1)
    }

    @Test
    fun `saving a new job returns the instance that was passed in`() {
        val job = createJobEntity()

        val saved = jobRepository.save(job)

        assertThat(saved).isSameAs(job)
    }

    @Test
    fun `a saved entity is no longer new`() {
        val job = createJobEntity()

        jobRepository.save(job)
        entityManager.flush()

        assertThat(job.isNew()).isFalse()
    }

    @Test
    fun `an entity read back from the database is not new`() {
        val job = jobRepository.save(createJobEntity())
        entityManager.flush()
        // Clearing forces a real read; otherwise findById returns the
        // instance already in the persistence context and @PostLoad
        // never runs.
        entityManager.clear()

        val loaded = jobRepository.findById(job.id).orElseThrow()

        assertThat(loaded.isNew()).isFalse()
    }

    @Test
    fun `the id exposed through Persistable is the entity id`() {
        val job = createJobEntity()

        val persistable: Persistable<UUID> = job

        assertThat(persistable.id).isEqualTo(job.id)
    }

    @Test
    fun `rebuilding an entity with an existing id is rejected instead of overwriting it`() {
        val existing = jobRepository.save(createJobEntity(company = "Original Corp"))
        entityManager.flush()
        // A second instance carrying the same id. Under the old merge
        // behaviour this silently replaced the stored row.
        val rebuilt = createJobEntity(id = existing.id, company = "Impostor Corp")

        assertThatThrownBy {
            jobRepository.save(rebuilt)
            entityManager.flush()
        }.isInstanceOf(DuplicateKeyException::class.java)
    }

    @Test
    fun `saving a new task inserts it without loading it first`() {
        // The task's foreign key needs a job row that genuinely exists,
        // so the job is flushed and its statements discarded before the
        // counters that matter are read.
        val job = jobRepository.save(createJobEntity())
        entityManager.flush()
        val task = createTaskEntity(jobId = job.id)
        val statistics = statistics()
        statistics.clear()

        taskRepository.save(task)
        entityManager.flush()

        assertThat(statistics.prepareStatementCount).isEqualTo(1)
        assertThat(statistics.entityInsertCount).isEqualTo(1)
    }
}
