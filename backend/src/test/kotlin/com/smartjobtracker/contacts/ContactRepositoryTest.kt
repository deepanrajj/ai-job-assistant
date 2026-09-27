package com.smartjobtracker.contacts

import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.testsupport.contacts.contactFixtureTimestamp
import com.smartjobtracker.testsupport.contacts.createContactEntity
import com.smartjobtracker.testsupport.jobs.createJobEntity
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@Transactional
class ContactRepositoryTest {
    @Autowired
    lateinit var contactRepository: ContactRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    private fun saveJob(): UUID = jobRepository.save(createJobEntity()).id

    @Test
    fun `returns a job's contacts in creation order`() {
        val jobId = saveJob()
        contactRepository.save(
            createContactEntity(jobId = jobId, name = "Third", createdAt = contactFixtureTimestamp.plusDays(3)),
        )
        contactRepository.save(
            createContactEntity(jobId = jobId, name = "First", createdAt = contactFixtureTimestamp.plusDays(1)),
        )
        contactRepository.save(
            createContactEntity(jobId = jobId, name = "Second", createdAt = contactFixtureTimestamp.plusDays(2)),
        )

        val names = contactRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId).map { it.name }

        assertThat(names).containsExactly("First", "Second", "Third")
    }

    @Test
    fun `orders contacts sharing a creation instant by id`() {
        val jobId = saveJob()
        val firstId = UUID.fromString("11111111-1111-1111-1111-111111111111")
        val secondId = UUID.fromString("22222222-2222-2222-2222-222222222222")
        contactRepository.save(createContactEntity(id = secondId, name = "Second", jobId = jobId))
        contactRepository.save(createContactEntity(id = firstId, name = "First", jobId = jobId))

        val contacts = contactRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId)
        val names = contacts.map { it.name }
        val ids = contacts.map { it.id }

        assertThat(names).containsExactly("First", "Second")
        assertThat(ids).containsExactly(firstId, secondId)
    }

    @Test
    fun `returns only the contacts belonging to the requested job`() {
        val firstJobId = saveJob()
        val secondJobId = saveJob()
        val firstJobContactName = "FirstJob Contact"
        val secondJobContactName = "SecondJob Contact"
        contactRepository.save(createContactEntity(name = firstJobContactName, jobId = firstJobId))
        contactRepository.save(createContactEntity(name = secondJobContactName, jobId = secondJobId))

        val firstJobContactNames =
            contactRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(firstJobId).map { it.name }
        val secondJobContactNames =
            contactRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(secondJobId).map { it.name }

        assertThat(firstJobContactNames).containsExactly(firstJobContactName)
        assertThat(secondJobContactNames).containsExactly(secondJobContactName)
    }

    @Test
    fun `returns an empty list for a job with no contacts`() {
        val jobId = saveJob()
        val otherJobId = saveJob()
        contactRepository.save(createContactEntity(jobId = otherJobId, name = "Theirs"))

        assertThat(contactRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId)).isEmpty()
    }

    @Test
    fun `finds a contact by id and job id`() {
        val jobId = saveJob()
        val contactId = UUID.fromString("11111111-1111-1111-1111-111111111111")
        contactRepository.save(createContactEntity(id = contactId, jobId = jobId))

        val contact = contactRepository.findByIdAndJobId(id = contactId, jobId = jobId)

        assertThat(contact?.id).isEqualTo(contactId)
    }

    @Test
    fun `does not find a contact under a different job`() {
        val firstJobId = saveJob()
        val secondJobId = saveJob()
        val firstJobContactId = UUID.fromString("11111111-1111-1111-1111-111111111111")
        contactRepository.save(createContactEntity(id = firstJobContactId, jobId = firstJobId))

        val contact = contactRepository.findByIdAndJobId(id = firstJobContactId, jobId = secondJobId)

        assertThat(contact).isNull()
    }
}
