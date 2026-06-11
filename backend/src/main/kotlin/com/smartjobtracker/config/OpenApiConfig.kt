package com.smartjobtracker.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {
    @Bean
    fun smartJobTrackerOpenApi(): OpenAPI =
        OpenAPI()
            .info(
                Info()
                    .title("Smart Job Tracker API")
                    .description("Backend API for tracking jobs and using AI job assistance.")
                    .version("0.1.0"),
            )
}
