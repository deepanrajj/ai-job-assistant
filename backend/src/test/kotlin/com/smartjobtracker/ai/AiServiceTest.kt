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
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AiServiceTest {
    @Test
    fun `analyzeJob builds request and maps structured response`() {
        val client =
            RecordingAiStructuredResponseClient(
                response = createAnalyzeJobStructuredJson(),
            )
        val service = createService(client)

        val response = service.analyzeJob(AnalyzeJobRequest(description = "Kotlin Spring role"))

        assertThat(response.summary).isEqualTo("Backend role")
        assertThat(response.requiredSkills).isEqualTo(listOf("Kotlin", "Spring"))
        assertThat(client.lastRequest.model).isEqualTo("gpt-test")
        assertThat(client.lastRequest.text.format.name).isEqualTo("job_analysis")
        assertThat(
            client.lastRequest.input[1]
                .content
                .first()
                .text,
        ).contains("Kotlin Spring role")
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

        assertThat(response.answer).isEqualTo("Prepare Spring MVC examples.")
        assertThat(client.lastRequest.text.format.name).isEqualTo("job_answer")
        assertThat(
            client.lastRequest.input[1]
                .content
                .first()
                .text,
        ).contains("How should I prepare?")
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
