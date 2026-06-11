package com.smartjobtracker.testsupport.ai

import com.smartjobtracker.ai.OpenAiClient
import com.smartjobtracker.ai.client.OpenAiInputContent
import com.smartjobtracker.ai.client.OpenAiInputMessage
import com.smartjobtracker.ai.client.OpenAiRequest
import com.smartjobtracker.ai.client.OpenAiText
import com.smartjobtracker.ai.client.OpenAiTextFormat
import com.smartjobtracker.config.OpenAiProperties
import com.smartjobtracker.testsupport.createTestObjectMapper
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

fun createOpenAiClient(
    status: HttpStatus,
    body: String,
): OpenAiClient {
    val webClient =
        WebClient
            .builder()
            .exchangeFunction {
                Mono.just(
                    ClientResponse
                        .create(status)
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .body(body)
                        .build(),
                )
            }.build()

    return createOpenAiClient(webClient)
}

fun createOpenAiClient(webClient: WebClient): OpenAiClient =
    OpenAiClient(
        webClient = webClient,
        properties =
            OpenAiProperties(
                apiKey = "test-key",
                baseUrl = "https://api.test",
                model = "gpt-test",
            ),
        mapper = createTestObjectMapper(),
    )

fun createOpenAiClientWithError(error: Throwable): OpenAiClient {
    val webClient =
        WebClient
            .builder()
            .exchangeFunction { Mono.error(error) }
            .build()

    return createOpenAiClient(webClient)
}

fun createOpenAiEmptyBodyClient(): OpenAiClient {
    val webClient =
        WebClient
            .builder()
            .exchangeFunction {
                Mono.just(
                    ClientResponse
                        .create(HttpStatus.OK)
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .build(),
                )
            }.build()

    return createOpenAiClient(webClient)
}

fun createOpenAiRequest(): OpenAiRequest =
    OpenAiRequest(
        model = "gpt-test",
        input =
            listOf(
                OpenAiInputMessage(
                    role = "user",
                    content = listOf(OpenAiInputContent(text = "Analyze this job.")),
                ),
            ),
        text =
            OpenAiText(
                format =
                    OpenAiTextFormat(
                        name = "test_schema",
                        schema = mapOf("type" to "object"),
                    ),
            ),
    )
