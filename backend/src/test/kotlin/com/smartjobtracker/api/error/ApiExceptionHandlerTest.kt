package com.smartjobtracker.api.error

import com.smartjobtracker.ai.AiController
import com.smartjobtracker.ai.AiService
import com.smartjobtracker.ai.dto.AnalyzeJobRequest
import com.smartjobtracker.testsupport.ai.FakeAiService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.core.MethodParameter
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.validation.BeanPropertyBindingResult
import org.springframework.validation.FieldError
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean
import org.springframework.web.bind.MethodArgumentNotValidException

class ApiExceptionHandlerTest {
    private lateinit var aiService: FakeAiService
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        aiService = FakeAiService()
        mockMvc = createMockMvc(aiService)
    }

    @Test
    fun `validation errors return structured api response`() {
        mockMvc
            .perform(
                post("/ai/analyze-job")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"description":""}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.VALIDATION_FAILED.value))
            .andExpect(jsonPath("$.message").value("Request validation failed."))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("description"))
    }

    @Test
    fun `api exceptions return structured api response`() {
        aiService.analyzeHandler = {
            throw ApiException(
                status = HttpStatus.BAD_GATEWAY,
                errorCode = ApiErrorCode.AI_REQUEST_FAILED,
                message = "AI provider request failed.",
            )
        }

        mockMvc
            .perform(
                post("/ai/analyze-job")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"description":"Backend role"}"""),
            ).andExpect(status().isBadGateway)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.AI_REQUEST_FAILED.value))
            .andExpect(jsonPath("$.message").value("AI provider request failed."))
    }

    @Test
    fun `malformed request bodies return structured api response`() {
        mockMvc
            .perform(
                post("/ai/analyze-job")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{"),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.MALFORMED_REQUEST.value))
            .andExpect(jsonPath("$.message").value("Request body is invalid."))
    }

    @Test
    fun `unexpected exceptions return structured api response`() {
        aiService.analyzeHandler = {
            throw IllegalStateException("Unexpected failure")
        }

        mockMvc
            .perform(
                post("/ai/analyze-job")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"description":"Backend role"}"""),
            ).andExpect(status().isInternalServerError)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.INTERNAL_ERROR.value))
            .andExpect(jsonPath("$.message").value("Unexpected server error."))
    }

    @Test
    fun `validation errors use fallback field message when message is missing`() {
        val response =
            ApiExceptionHandler()
                .handleValidationException(createValidationException(defaultMessage = null))
        val body = response.body

        assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        assertThat(body?.code).isEqualTo(ApiErrorCode.VALIDATION_FAILED.value)
        assertThat(body?.fieldErrors?.single()?.message).isEqualTo("Invalid value")
    }

    private fun createMockMvc(aiService: AiService): MockMvc {
        val validator = LocalValidatorFactoryBean()
        validator.afterPropertiesSet()

        return MockMvcBuilders
            .standaloneSetup(AiController(aiService))
            .setControllerAdvice(ApiExceptionHandler())
            .setValidator(validator)
            .build()
    }

    private fun createValidationException(defaultMessage: String?): MethodArgumentNotValidException {
        val method = ValidationMethodSource::class.java.getDeclaredMethod("submit", AnalyzeJobRequest::class.java)
        val bindingResult = BeanPropertyBindingResult(AnalyzeJobRequest(description = ""), "request")

        bindingResult.addError(
            FieldError(
                "request",
                "description",
                "",
                false,
                null,
                null,
                defaultMessage,
            ),
        )

        return MethodArgumentNotValidException(MethodParameter(method, 0), bindingResult)
    }

    private class ValidationMethodSource {
        fun submit(request: AnalyzeJobRequest): AnalyzeJobRequest = request
    }
}
