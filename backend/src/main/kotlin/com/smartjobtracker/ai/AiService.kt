package com.smartjobtracker.ai

import com.smartjobtracker.ai.dto.AnalyzeJobRequest
import com.smartjobtracker.ai.dto.AnalyzeJobResponse
import com.smartjobtracker.ai.dto.AskJobRequest
import com.smartjobtracker.ai.dto.AskJobResponse
import com.smartjobtracker.ai.mapper.AiResponseMapper
import org.springframework.stereotype.Service

interface AiService {
    fun analyzeJob(request: AnalyzeJobRequest): AnalyzeJobResponse

    fun askJob(request: AskJobRequest): AskJobResponse
}

@Service
class DefaultAiService(
    private val openAiRequestFactory: OpenAiRequestFactory,
    private val aiStructuredResponseClient: AiStructuredResponseClient,
    private val aiResponseMapper: AiResponseMapper,
) : AiService {
    override fun analyzeJob(request: AnalyzeJobRequest): AnalyzeJobResponse {
        val openAiRequest = openAiRequestFactory.createAnalyzeJobRequest(request.description)
        val json = aiStructuredResponseClient.createStructuredResponse(openAiRequest)

        return aiResponseMapper.toAnalyzeJobResponse(json)
    }

    override fun askJob(request: AskJobRequest): AskJobResponse {
        val openAiRequest = openAiRequestFactory.createAskJobRequest(request.description, request.question)
        val json = aiStructuredResponseClient.createStructuredResponse(openAiRequest)

        return aiResponseMapper.toAskJobResponse(json)
    }
}
