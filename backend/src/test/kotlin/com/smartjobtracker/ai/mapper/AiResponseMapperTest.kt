package com.smartjobtracker.ai.mapper

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.testsupport.createTestObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.catchThrowableOfType
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class AiResponseMapperTest {
    private val mapper = AiResponseMapper(createTestObjectMapper())

    @Test
    fun `toAnalyzeJobResponse maps valid structured json`() {
        val response =
            mapper.toAnalyzeJobResponse(
                """
                {
                  "summary": "Good fit",
                  "requiredSkills": ["Kotlin"],
                  "niceToHaveSkills": ["Kubernetes"],
                  "seniority": "Mid",
                  "prepTasks": ["Review services"]
                }
                """.trimIndent(),
            )

        assertThat(response.summary).isEqualTo("Good fit")
        assertThat(response.requiredSkills).isEqualTo(listOf("Kotlin"))
    }

    @Test
    fun `toAnalyzeJobResponse converts invalid json into api exception`() {
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                mapper.toAnalyzeJobResponse("""{"summary":"Missing required fields"}""")
            }

        assertThat(exception.status).isEqualTo(HttpStatus.BAD_GATEWAY)
        assertThat(exception.errorCode).isEqualTo(ApiErrorCode.AI_RESPONSE_INVALID)
    }
}
