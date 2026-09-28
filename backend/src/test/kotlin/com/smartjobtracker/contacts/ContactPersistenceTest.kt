package com.smartjobtracker.contacts

import com.smartjobtracker.jobs.Job
import com.smartjobtracker.testsupport.contacts.createContactEntity
import com.smartjobtracker.testsupport.jobs.createJobEntity
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
class ContactPersistenceTest {
    @PersistenceContext
    lateinit var entityManager: EntityManager

    private fun persistJob(): Job {
        val job = createJobEntity()
        entityManager.persist(job)

        return job
    }

    @Test
    fun `persists a contact and reads every column back from the contacts table`() {
        val job = persistJob()
        val contact = createContactEntity(jobId = job.id)

        entityManager.persist(contact)
        entityManager.flush()
        entityManager.clear()

        val loaded = entityManager.find(Contact::class.java, contact.id)

        assertThat(loaded).isNotNull()
        assertThat(loaded.id).isEqualTo(contact.id)
        assertThat(loaded.jobId).isEqualTo(job.id)
        assertThat(loaded.type).isEqualTo(contact.type)
        assertThat(loaded.name).isEqualTo(contact.name)
        assertThat(loaded.email).isEqualTo(contact.email)
        assertThat(loaded.phone).isEqualTo(contact.phone)
        assertThat(loaded.profileUrl).isEqualTo(contact.profileUrl)
        assertThat(loaded.lastContactedAt).isEqualTo(contact.lastContactedAt)
        assertThat(loaded.notes).isEqualTo(contact.notes)
        assertThat(loaded.createdAt.toInstant()).isEqualTo(contact.createdAt.toInstant())
        assertThat(loaded.updatedAt.toInstant()).isEqualTo(contact.updatedAt.toInstant())
    }

    @Test
    fun `persists a contact with every optional field null`() {
        val job = persistJob()
        val contact =
            createContactEntity(
                jobId = job.id,
                email = null,
                phone = null,
                profileUrl = null,
                lastContactedAt = null,
                notes = null,
            )

        entityManager.persist(contact)
        entityManager.flush()
        entityManager.clear()

        val loaded = entityManager.find(Contact::class.java, contact.id)

        assertThat(loaded).isNotNull()
        assertThat(loaded.email).isNull()
        assertThat(loaded.phone).isNull()
        assertThat(loaded.profileUrl).isNull()
        assertThat(loaded.lastContactedAt).isNull()
        assertThat(loaded.notes).isNull()
    }

    @Test
    fun `deleting a job deletes its contacts`() {
        val job = persistJob()
        val contact = createContactEntity(jobId = job.id)
        entityManager.persist(contact)
        entityManager.flush()

        entityManager.remove(entityManager.find(Job::class.java, job.id))
        entityManager.flush()

        // JPA does not know about database-level cascades, so clear the
        // persistence context to force a fresh read rather than a cache hit.
        entityManager.clear()

        assertThat(entityManager.find(Contact::class.java, contact.id)).isNull()
    }

    @Test
    fun `rejects a contact that references an unknown job`() {
        val contact = createContactEntity(jobId = UUID.randomUUID())

        entityManager.persist(contact)

        assertThatThrownBy { entityManager.flush() }
            .isInstanceOf(PersistenceException::class.java)
            .hasRootCauseInstanceOf(SQLException::class.java)
    }
}
