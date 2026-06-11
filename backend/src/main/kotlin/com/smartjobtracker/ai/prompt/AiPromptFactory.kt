package com.smartjobtracker.ai.prompt

import org.springframework.stereotype.Component

data class AiPromptMessages(
    val developerPrompt: String,
    val userPrompt: String,
)

@Component
class AiPromptFactory {
    fun createAnalyzeJobPrompts(description: String): AiPromptMessages =
        AiPromptMessages(
            developerPrompt =
                """
                Analyze this software-engineering job description.
                Keep the result concise and UI-friendly.
                Do not invent skills that are not clearly supported by the text.
                """.trimIndent(),
            userPrompt =
                """
                Analyze this job description and return structured data.
                
                Job description:
                $description
                """.trimIndent(),
        )

    fun createAskJobPrompts(
        description: String,
        question: String,
    ): AiPromptMessages =
        AiPromptMessages(
            developerPrompt =
                """
                Answer only from the provided job description.
                If the answer is not supported by the description, say that clearly.
                """.trimIndent(),
            userPrompt =
                """
                Job description:
                $description
                
                Question:
                $question
                """.trimIndent(),
        )
}
