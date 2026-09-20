package com.smartjobtracker.notes

import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.notes.createNoteEntity
import com.smartjobtracker.testsupport.notes.noteFixtureTimestamp
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@Transactional
class NoteRepositoryTest {
    @Autowired
    lateinit var noteRepository: NoteRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    private fun saveJob(): UUID = jobRepository.save(createJobEntity()).id

    @Test
    fun `returns a job's notes in creation order`() {
        val jobId = saveJob()
        noteRepository.save(
            createNoteEntity(jobId = jobId, body = "Middle", createdAt = noteFixtureTimestamp.plusDays(2)),
        )
        noteRepository.save(
            createNoteEntity(jobId = jobId, body = "Oldest", createdAt = noteFixtureTimestamp.plusDays(1)),
        )
        noteRepository.save(
            createNoteEntity(jobId = jobId, body = "Newest", createdAt = noteFixtureTimestamp.plusDays(3)),
        )

        val bodies = noteRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId).map { it.body }

        assertThat(bodies).containsExactly("Oldest", "Middle", "Newest")
    }

    @Test
    fun `orders notes sharing a creation instant by id`() {
        val jobId = saveJob()
        val firstId = UUID.fromString("11111111-1111-1111-1111-111111111111")
        val secondId = UUID.fromString("22222222-2222-2222-2222-222222222222")
        noteRepository.save(createNoteEntity(jobId = jobId, id = secondId, body = "Second"))
        noteRepository.save(createNoteEntity(jobId = jobId, id = firstId, body = "First"))

        val bodies = noteRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId).map { it.body }

        assertThat(bodies).containsExactly("First", "Second")
    }

    @Test
    fun `returns only the notes belonging to the requested job`() {
        val jobId = saveJob()
        val otherJobId = saveJob()
        noteRepository.save(createNoteEntity(jobId = jobId, body = "Mine"))
        noteRepository.save(createNoteEntity(jobId = otherJobId, body = "Theirs"))

        val bodies = noteRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId).map { it.body }

        assertThat(bodies).containsExactly("Mine")
    }

    @Test
    fun `returns an empty list for a job with no notes`() {
        val jobId = saveJob()
        val otherJobId = saveJob()
        noteRepository.save(createNoteEntity(jobId = otherJobId, body = "Theirs"))

        assertThat(noteRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId)).isEmpty()
    }
}
