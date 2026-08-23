package com.smartjobtracker.config

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
class OpenApiConfigTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `openapi docs expose api metadata and routes`() {
        mockMvc
            .perform(get("/api/v3/api-docs").contextPath("/api"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.info.title").value("Smart Job Tracker API"))
            .andExpect(jsonPath("$.paths['/ai/health']").exists())
    }

    @Test
    fun `openapi docs describe job routes and their error responses`() {
        mockMvc
            .perform(get("/api/v3/api-docs").contextPath("/api"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.paths['/jobs'].get").exists())
            .andExpect(jsonPath("$.paths['/jobs'].post.responses['201']").exists())
            .andExpect(jsonPath("$.paths['/jobs'].post.responses['400']").exists())
            .andExpect(jsonPath("$.paths['/jobs/{id}'].get.responses['404']").exists())
            .andExpect(jsonPath("$.paths['/jobs/{id}'].put.responses['400']").exists())
            .andExpect(jsonPath("$.paths['/jobs/{id}'].put.responses['404']").exists())
            .andExpect(jsonPath("$.paths['/jobs/{id}'].delete.responses['204']").exists())
            .andExpect(jsonPath("$.paths['/jobs/{id}'].delete.responses['404']").exists())
            .andExpect(jsonPath("$.components.schemas.ApiErrorResponse").exists())
    }
}
