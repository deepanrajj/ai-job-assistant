package com.smartjobtracker.jobs.dto

import org.assertj.core.api.Assertions.assertThatIllegalArgumentException
import org.junit.jupiter.api.Test

class JobRequestMappingTest {
    @Test
    fun `update mapping requires a status that passed validation`() {
        val request =
            UpdateJobRequest(
                company = "Acme Corp",
                roleTitle = "Backend Engineer",
                location = null,
                status = null,
                jobUrl = null,
                salaryMin = null,
                salaryMax = null,
                description = null,
            )

        assertThatIllegalArgumentException().isThrownBy { request.toCommand() }
    }
}
