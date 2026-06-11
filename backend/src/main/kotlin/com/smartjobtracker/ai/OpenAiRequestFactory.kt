package com.smartjobtracker.ai

import com.smartjobtracker.ai.client.OpenAiInputContent
import com.smartjobtracker.ai.client.OpenAiInputMessage
import com.smartjobtracker.ai.client.OpenAiRequest
import com.smartjobtracker.ai.client.OpenAiText
import com.smartjobtracker.ai.client.OpenAiTextFormat
import com.smartjobtracker.ai.prompt.AiPromptFactory
import com.smartjobtracker.ai.prompt.AiPromptMessages
import com.smartjobtracker.ai.schema.AiResponseSchemas
import com.smartjobtracker.config.OpenAiProperties
import org.springframework.stereotype.Component

@Component
class OpenAiRequestFactory(
    private val properties: OpenAiProperties,
    private val promptFactory: AiPromptFactory,
) {
    fun createAnalyzeJobRequest(description: String): OpenAiRequest =
        createStructuredRequest(
            formatName = "job_analysis",
            schema = AiResponseSchemas.analyzeJobSchema,
            prompts = promptFactory.createAnalyzeJobPrompts(description),
        )

    fun createAskJobRequest(
        description: String,
        question: String,
    ): OpenAiRequest =
        createStructuredRequest(
            formatName = "job_answer",
            schema = AiResponseSchemas.askJobSchema,
            prompts = promptFactory.createAskJobPrompts(description, question),
        )

    private fun createStructuredRequest(
        formatName: String,
        schema: Map<String, Any>,
        prompts: AiPromptMessages,
    ): OpenAiRequest =
        OpenAiRequest(
            model = properties.model,
            input =
                listOf(
                    OpenAiInputMessage(
                        role = "developer",
                        content = listOf(OpenAiInputContent(text = prompts.developerPrompt)),
                    ),
                    OpenAiInputMessage(
                        role = "user",
                        content = listOf(OpenAiInputContent(text = prompts.userPrompt)),
                    ),
                ),
            text =
                OpenAiText(
                    format =
                        OpenAiTextFormat(
                            name = formatName,
                            schema = schema,
                        ),
                ),
        )
}
