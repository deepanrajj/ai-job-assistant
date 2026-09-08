package com.smartjobtracker.tasks

import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.tasks.createTaskEntity
import com.smartjobtracker.testsupport.tasks.taskFixtureTimestamp
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@Transactional
class TaskRepositoryTest {
    @Autowired
    lateinit var taskRepository: TaskRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    /** Named for its mechanism, to distinguish it from the
     * `EntityManager`-based `persistJob` in `TaskPersistenceTest`. */
    private fun saveJob(): UUID = jobRepository.save(createJobEntity()).id

    @Test
    fun `returns a job's tasks in creation order`() {
        val jobId = saveJob()
        taskRepository.save(
            createTaskEntity(jobId = jobId, title = "Middle", createdAt = taskFixtureTimestamp.plusDays(2)),
        )
        taskRepository.save(
            createTaskEntity(jobId = jobId, title = "Oldest", createdAt = taskFixtureTimestamp.plusDays(1)),
        )
        taskRepository.save(
            createTaskEntity(jobId = jobId, title = "Newest", createdAt = taskFixtureTimestamp.plusDays(3)),
        )

        val titles = taskRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId).map { it.title }

        assertThat(titles).containsExactly("Oldest", "Middle", "Newest")
    }

    @Test
    fun `orders tasks sharing a creation instant by id`() {
        val jobId = saveJob()
        val firstId = UUID.fromString("11111111-1111-1111-1111-111111111111")
        val secondId = UUID.fromString("22222222-2222-2222-2222-222222222222")
        taskRepository.save(createTaskEntity(jobId = jobId, id = secondId, title = "Second"))
        taskRepository.save(createTaskEntity(jobId = jobId, id = firstId, title = "First"))

        val titles = taskRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId).map { it.title }

        assertThat(titles).containsExactly("First", "Second")
    }

    @Test
    fun `returns only the tasks belonging to the requested job`() {
        val jobId = saveJob()
        val otherJobId = saveJob()
        taskRepository.save(createTaskEntity(jobId = jobId, title = "Mine"))
        taskRepository.save(createTaskEntity(jobId = otherJobId, title = "Theirs"))

        val titles = taskRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId).map { it.title }

        assertThat(titles).containsExactly("Mine")
    }

    @Test
    fun `returns an empty list for a job with no tasks`() {
        val jobId = saveJob()
        val otherJobId = saveJob()
        taskRepository.save(createTaskEntity(jobId = otherJobId, title = "Theirs"))

        assertThat(taskRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId)).isEmpty()
    }
}
