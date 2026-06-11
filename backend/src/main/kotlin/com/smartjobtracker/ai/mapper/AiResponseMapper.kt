package com.smartjobtracker.ai.mapper

import com.smartjobtracker.ai.dto.AnalyzeJobResponse
import com.smartjobtracker.ai.dto.AskJobResponse
import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import tools.jackson.core.JacksonException
import tools.jackson.databind.ObjectMapper

@Component
class AiResponseMapper(
    private val mapper: ObjectMapper,
) {
    fun toAnalyzeJobResponse(json: String): AnalyzeJobResponse =
        readStructuredResponse(
            json,
            AnalyzeJobResponse::class.java,
        )

    fun toAskJobResponse(json: String): AskJobResponse =
        readStructuredResponse(
            json,
            AskJobResponse::class.java,
        )

    private fun <T> readStructuredResponse(
        json: String,
        responseType: Class<T>,
    ): T =
        try {
            mapper.readValue(json, responseType)
        } catch (exception: JacksonException) {
            throw ApiException(
                status = HttpStatus.BAD_GATEWAY,
                errorCode = ApiErrorCode.AI_RESPONSE_INVALID,
                message = "AI provider returned an invalid structured response.",
                cause = exception,
            )
        }
}
