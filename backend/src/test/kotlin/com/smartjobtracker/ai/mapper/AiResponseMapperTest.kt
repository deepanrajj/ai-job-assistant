package com.smartjobtracker.ai.mapper

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.testsupport.createTestObjectMapper
import org.springframework.http.HttpStatus
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

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

        assertEquals("Good fit", response.summary)
        assertEquals(listOf("Kotlin"), response.requiredSkills)
    }

    @Test
    fun `toAnalyzeJobResponse converts invalid json into api exception`() {
        val exception =
            assertFailsWith<ApiException> {
                mapper.toAnalyzeJobResponse("""{"summary":"Missing required fields"}""")
            }

        assertEquals(HttpStatus.BAD_GATEWAY, exception.status)
        assertEquals(ApiErrorCode.AI_RESPONSE_INVALID, exception.errorCode)
    }
}
