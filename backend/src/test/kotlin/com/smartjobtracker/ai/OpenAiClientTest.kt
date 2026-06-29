package com.smartjobtracker.ai

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.testsupport.ai.TestWebClientException
import com.smartjobtracker.testsupport.ai.createOpenAiClient
import com.smartjobtracker.testsupport.ai.createOpenAiClientWithError
import com.smartjobtracker.testsupport.ai.createOpenAiEmptyBodyClient
import com.smartjobtracker.testsupport.ai.createOpenAiRequest
import com.smartjobtracker.testsupport.api.assertBadGatewayApiException
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.catchThrowableOfType
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class OpenAiClientTest {
    @Test
    fun `createStructuredResponse extracts output text`() {
        val providerResponse =
            """
            {
              "output": [
                {
                  "content": [
                    {
                      "type": "output_text",
                      "text": "{\"summary\":\"Parsed\"}"
                    }
                  ]
                }
              ]
            }
            """.trimIndent()
        val client =
            createOpenAiClient(
                status = HttpStatus.OK,
                body = providerResponse,
            )
        val response = client.createStructuredResponse(createOpenAiRequest())

        assertThat(response).isEqualTo("""{"summary":"Parsed"}""")
    }

    @Test
    fun `createStructuredResponse converts provider errors into api exception`() {
        val client =
            createOpenAiClient(
                status = HttpStatus.INTERNAL_SERVER_ERROR,
                body = """{"error":"provider unavailable"}""",
            )
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                client.createStructuredResponse(createOpenAiRequest())
            }

        assertBadGatewayApiException(
            exception = exception,
            errorCode = ApiErrorCode.AI_REQUEST_FAILED,
            message = "AI provider request failed.",
        )
    }

    @Test
    fun `createStructuredResponse converts missing output text into api exception`() {
        val client =
            createOpenAiClient(
                status = HttpStatus.OK,
                body = """{"output":[]}""",
            )
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                client.createStructuredResponse(createOpenAiRequest())
            }

        assertBadGatewayApiException(
            exception = exception,
            errorCode = ApiErrorCode.AI_RESPONSE_INVALID,
            message = "AI provider response did not include output text.",
        )
    }

    @Test
    fun `createStructuredResponse converts unreadable provider response into api exception`() {
        val client =
            createOpenAiClient(
                status = HttpStatus.OK,
                body = "not-json",
            )
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                client.createStructuredResponse(createOpenAiRequest())
            }

        assertBadGatewayApiException(
            exception = exception,
            errorCode = ApiErrorCode.AI_RESPONSE_INVALID,
            message = "AI provider returned an unreadable response.",
        )
    }

    @Test
    fun `createStructuredResponse converts empty provider response into api exception`() {
        val client = createOpenAiEmptyBodyClient()
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                client.createStructuredResponse(createOpenAiRequest())
            }

        assertBadGatewayApiException(
            exception = exception,
            errorCode = ApiErrorCode.AI_RESPONSE_INVALID,
            message = "AI provider returned an empty response.",
        )
    }

    @Test
    fun `createStructuredResponse converts web client exception into api exception`() {
        val client = createOpenAiClientWithError(TestWebClientException())
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                client.createStructuredResponse(createOpenAiRequest())
            }

        assertBadGatewayApiException(
            exception = exception,
            errorCode = ApiErrorCode.AI_REQUEST_FAILED,
            message = "AI provider is unavailable.",
        )
    }

    @Test
    fun `createStructuredResponse converts illegal state exception into api exception`() {
        val client = createOpenAiClientWithError(IllegalStateException("Request timed out"))
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                client.createStructuredResponse(createOpenAiRequest())
            }

        assertBadGatewayApiException(
            exception = exception,
            errorCode = ApiErrorCode.AI_REQUEST_FAILED,
            message = "AI provider request timed out.",
        )
    }

    @Test
    fun `createStructuredResponse converts missing text field in output_text into api exception`() {
        val providerResponse =
            """
            {
              "output": [
                {
                  "content": [
                    {
                      "type": "output_text"
                    }
                  ]
                }
              ]
            }
            """.trimIndent()
        val client =
            createOpenAiClient(
                status = HttpStatus.OK,
                body = providerResponse,
            )
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                client.createStructuredResponse(createOpenAiRequest())
            }

        assertBadGatewayApiException(
            exception = exception,
            errorCode = ApiErrorCode.AI_RESPONSE_INVALID,
            message = "AI provider response did not include output text.",
        )
    }

    @Test
    fun `createStructuredResponse ignores non-output content and extracts output text`() {
        val providerResponse =
            """
            {
              "output": [
                {
                  "content": [
                    {
                      "type": "refusal",
                      "text": "No"
                    },
                    {
                      "type": "output_text",
                      "text": "{\"summary\":\"Parsed\"}"
                    }
                  ]
                }
              ]
            }
            """.trimIndent()
        val client =
            createOpenAiClient(
                status = HttpStatus.OK,
                body = providerResponse,
            )
        val response = client.createStructuredResponse(createOpenAiRequest())

        assertThat(response).isEqualTo("""{"summary":"Parsed"}""")
    }
}
