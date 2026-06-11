package com.smartjobtracker.ai

import com.smartjobtracker.ai.dto.AnalyzeJobRequest
import com.smartjobtracker.ai.dto.AskJobRequest
import com.smartjobtracker.ai.mapper.AiResponseMapper
import com.smartjobtracker.ai.prompt.AiPromptFactory
import com.smartjobtracker.config.OpenAiProperties
import com.smartjobtracker.testsupport.ai.RecordingAiStructuredResponseClient
import com.smartjobtracker.testsupport.ai.createAnalyzeJobStructuredJson
import com.smartjobtracker.testsupport.ai.createAskJobStructuredJson
import com.smartjobtracker.testsupport.createTestObjectMapper
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AiServiceTest {
    @Test
    fun `analyzeJob builds request and maps structured response`() {
        val client =
            RecordingAiStructuredResponseClient(
                response = createAnalyzeJobStructuredJson(),
            )
        val service = createService(client)

        val response = service.analyzeJob(AnalyzeJobRequest(description = "Kotlin Spring role"))

        assertEquals("Backend role", response.summary)
        assertEquals(listOf("Kotlin", "Spring"), response.requiredSkills)
        assertEquals("gpt-test", client.lastRequest.model)
        assertEquals("job_analysis", client.lastRequest.text.format.name)
        assertTrue(
            client.lastRequest.input[1]
                .content
                .first()
                .text
                .contains("Kotlin Spring role"),
        )
    }

    @Test
    fun `askJob builds request and maps answer response`() {
        val client =
            RecordingAiStructuredResponseClient(
                response = createAskJobStructuredJson(),
            )
        val service = createService(client)

        val response =
            service.askJob(
                AskJobRequest(
                    description = "Backend job using Spring MVC",
                    question = "How should I prepare?",
                ),
            )

        assertEquals("Prepare Spring MVC examples.", response.answer)
        assertEquals("job_answer", client.lastRequest.text.format.name)
        assertTrue(
            client.lastRequest.input[1]
                .content
                .first()
                .text
                .contains("How should I prepare?"),
        )
    }

    private fun createService(client: RecordingAiStructuredResponseClient): AiService =
        DefaultAiService(
            openAiRequestFactory =
                OpenAiRequestFactory(
                    properties =
                        OpenAiProperties(
                            apiKey = "test-key",
                            baseUrl = "https://api.test",
                            model = "gpt-test",
                        ),
                    promptFactory = AiPromptFactory(),
                ),
            aiStructuredResponseClient = client,
            aiResponseMapper = AiResponseMapper(createTestObjectMapper()),
        )
}
