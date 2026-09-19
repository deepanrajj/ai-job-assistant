package com.smartjobtracker.tasks.dto

import org.assertj.core.api.Assertions.assertThatIllegalArgumentException
import org.junit.jupiter.api.Test

class TaskRequestMappingTest {
    @Test
    fun `update mapping requires a status that passed validation`() {
        val request =
            UpdateTaskRequest(
                title = "Prepare portfolio",
                status = null,
                dueDate = null,
            )

        assertThatIllegalArgumentException().isThrownBy { request.toCommand() }
    }
}
