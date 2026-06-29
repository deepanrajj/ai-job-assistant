package com.smartjobtracker.ai

import com.smartjobtracker.testsupport.ai.FakeAiService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders

class AiControllerTest {
    private lateinit var aiService: FakeAiService
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        aiService = FakeAiService()
        mockMvc = MockMvcBuilders.standaloneSetup(AiController(aiService)).build()
    }

    @Test
    fun `health returns ok response`() {
        mockMvc
            .perform(get("/ai/health"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.ok").value(true))
    }

    @Test
    fun `analyzeJob returns analysis response`() {
        mockMvc
            .perform(
                post("/ai/analyze-job")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"description":"Kotlin backend role"}"""),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.summary").value("Backend role"))
            .andExpect(jsonPath("$.requiredSkills[0]").value("Kotlin"))
            .andExpect(jsonPath("$.niceToHaveSkills[0]").value("Docker"))
            .andExpect(jsonPath("$.seniority").value("Senior"))
            .andExpect(jsonPath("$.prepTasks[0]").value("Review MVC"))

        assertThat(aiService.lastAnalyzeRequest.description).isEqualTo("Kotlin backend role")
    }

    @Test
    fun `askJob returns answer response`() {
        mockMvc
            .perform(
                post("/ai/ask-job")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "description": "Kotlin backend role",
                          "question": "How should I prepare?"
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.answer").value("Prepare Spring MVC examples."))

        assertThat(aiService.lastAskRequest.description).isEqualTo("Kotlin backend role")
        assertThat(aiService.lastAskRequest.question).isEqualTo("How should I prepare?")
    }
}
