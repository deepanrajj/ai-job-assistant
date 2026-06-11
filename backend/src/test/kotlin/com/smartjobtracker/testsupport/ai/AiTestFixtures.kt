package com.smartjobtracker.testsupport.ai

import com.smartjobtracker.ai.AiService
import com.smartjobtracker.ai.AiStructuredResponseClient
import com.smartjobtracker.ai.client.OpenAiRequest
import com.smartjobtracker.ai.dto.AnalyzeJobRequest
import com.smartjobtracker.ai.dto.AnalyzeJobResponse
import com.smartjobtracker.ai.dto.AskJobRequest
import com.smartjobtracker.ai.dto.AskJobResponse

fun createAnalyzeJobResponse(): AnalyzeJobResponse =
    AnalyzeJobResponse(
        summary = "Backend role",
        requiredSkills = listOf("Kotlin"),
        niceToHaveSkills = listOf("Docker"),
        seniority = "Senior",
        prepTasks = listOf("Review MVC"),
    )

fun createAnalyzeJobStructuredJson(): String =
    """
    {
      "summary": "Backend role",
      "requiredSkills": ["Kotlin", "Spring"],
      "niceToHaveSkills": ["Docker"],
      "seniority": "Senior",
      "prepTasks": ["Review MVC"]
    }
    """.trimIndent()

fun createAskJobStructuredJson(): String =
    """
    {
      "answer": "Prepare Spring MVC examples."
    }
    """.trimIndent()

class FakeAiService : AiService {
    lateinit var lastAnalyzeRequest: AnalyzeJobRequest
    lateinit var lastAskRequest: AskJobRequest

    var analyzeHandler: (AnalyzeJobRequest) -> AnalyzeJobResponse = {
        createAnalyzeJobResponse()
    }

    var askHandler: (AskJobRequest) -> AskJobResponse = {
        AskJobResponse(answer = "Prepare Spring MVC examples.")
    }

    override fun analyzeJob(request: AnalyzeJobRequest): AnalyzeJobResponse {
        lastAnalyzeRequest = request

        return analyzeHandler(request)
    }

    override fun askJob(request: AskJobRequest): AskJobResponse {
        lastAskRequest = request

        return askHandler(request)
    }
}

class RecordingAiStructuredResponseClient(
    private val response: String,
) : AiStructuredResponseClient {
    lateinit var lastRequest: OpenAiRequest

    override fun createStructuredResponse(request: OpenAiRequest): String {
        lastRequest = request

        return response
    }
}
