package com.smartjobtracker.ai

import com.smartjobtracker.ai.client.OpenAiRequest
import com.smartjobtracker.ai.client.OpenAiResponse
import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.config.OpenAiProperties
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientException
import org.springframework.web.reactive.function.client.WebClientResponseException
import tools.jackson.core.JacksonException
import tools.jackson.databind.ObjectMapper
import java.time.Duration

private object OpenAiClientConstants {
    const val OUTPUT_TEXT_TYPE = "output_text"
    const val RESPONSE_TIMEOUT_SECONDS = 60L
    const val RESPONSES_PATH = "/v1/responses"
}

@Component
class OpenAiClient(
    private val webClient: WebClient,
    private val properties: OpenAiProperties,
    private val mapper: ObjectMapper,
) : AiStructuredResponseClient {
    private val responseTimeout = Duration.ofSeconds(OpenAiClientConstants.RESPONSE_TIMEOUT_SECONDS)

    override fun createStructuredResponse(request: OpenAiRequest): String {
        val rawResponse = sendRequest(request)
        val aiResponse = parseResponse(rawResponse)

        return extractOutputText(aiResponse)
    }

    private fun sendRequest(request: OpenAiRequest): String {
        val rawResponse =
            try {
                webClient
                    .post()
                    .uri("${properties.baseUrl}${OpenAiClientConstants.RESPONSES_PATH}")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer ${properties.apiKey}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String::class.java)
                    .block(responseTimeout)
            } catch (exception: WebClientException) {
                throw createAiRequestException(exception)
            } catch (exception: IllegalStateException) {
                throw createAiRequestTimeoutException(exception)
            }

        return requireResponseBody(rawResponse)
    }

    private fun parseResponse(rawResponse: String): OpenAiResponse =
        try {
            mapper.readValue(rawResponse, OpenAiResponse::class.java)
        } catch (exception: JacksonException) {
            throw createInvalidAiResponseException("AI provider returned an unreadable response.", exception)
        }

    private fun requireResponseBody(rawResponse: String?): String {
        if (rawResponse != null) return rawResponse

        throw createInvalidAiResponseException("AI provider returned an empty response.", null)
    }

    private fun extractOutputText(aiResponse: OpenAiResponse): String {
        val outputContent =
            aiResponse.output
                .flatMap { it.content }
                .firstOrNull { it.type == OpenAiClientConstants.OUTPUT_TEXT_TYPE }

        if (outputContent == null || outputContent.text == null) {
            throw createInvalidAiResponseException("AI provider response did not include output text.", null)
        }

        return outputContent.text
    }

    private fun createAiRequestException(exception: WebClientException): ApiException {
        val message =
            if (exception is WebClientResponseException) {
                "AI provider request failed."
            } else {
                "AI provider is unavailable."
            }

        return ApiException(
            status = HttpStatus.BAD_GATEWAY,
            errorCode = ApiErrorCode.AI_REQUEST_FAILED,
            message = message,
            cause = exception,
        )
    }

    private fun createAiRequestTimeoutException(exception: IllegalStateException): ApiException =
        ApiException(
            status = HttpStatus.BAD_GATEWAY,
            errorCode = ApiErrorCode.AI_REQUEST_FAILED,
            message = "AI provider request timed out.",
            cause = exception,
        )

    private fun createInvalidAiResponseException(
        message: String,
        cause: Throwable?,
    ): ApiException =
        ApiException(
            status = HttpStatus.BAD_GATEWAY,
            errorCode = ApiErrorCode.AI_RESPONSE_INVALID,
            message = message,
            cause = cause,
        )
}
