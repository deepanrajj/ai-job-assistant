package com.smartjobtracker.notes

import com.smartjobtracker.jobs.Job
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.notes.createNoteEntity
import com.smartjobtracker.testsupport.notes.noteFixtureTimestamp
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
class NotePersistenceTest {
    @PersistenceContext
    lateinit var entityManager: EntityManager

    private fun persistJob(): Job {
        val job = createJobEntity()
        entityManager.persist(job)

        return job
    }

    @Test
    fun `persists a note and reads every column back from the notes table`() {
        val job = persistJob()
        val note = createNoteEntity(jobId = job.id)

        entityManager.persist(note)
        entityManager.flush()
        entityManager.clear()

        val loaded = entityManager.find(Note::class.java, note.id)

        assertThat(loaded).isNotNull()
        assertThat(loaded.jobId).isEqualTo(job.id)
        assertThat(loaded.body).isEqualTo("Recruiter said the team is hiring for a Q3 start.")
        assertThat(loaded.createdAt.toInstant()).isEqualTo(noteFixtureTimestamp.toInstant())
        assertThat(loaded.updatedAt.toInstant()).isEqualTo(noteFixtureTimestamp.toInstant())
    }

    @Test
    fun `deleting a job deletes its notes`() {
        val job = persistJob()
        val note = createNoteEntity(jobId = job.id)
        entityManager.persist(note)
        entityManager.flush()

        entityManager.remove(entityManager.find(Job::class.java, job.id))
        entityManager.flush()

        // JPA does not know about database-level cascades, so clear the
        // persistence context to force a fresh read rather than a cache hit.
        entityManager.clear()

        assertThat(entityManager.find(Note::class.java, note.id)).isNull()
    }

    @Test
    fun `rejects a note that references an unknown job`() {
        val note = createNoteEntity(jobId = UUID.randomUUID())

        entityManager.persist(note)

        assertThatThrownBy { entityManager.flush() }
            .isInstanceOf(PersistenceException::class.java)
            .hasRootCauseInstanceOf(SQLException::class.java)
    }
}
