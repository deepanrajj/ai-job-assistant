package com.smartjobtracker.config

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.WebClient

@Configuration
@EnableConfigurationProperties(OpenAiProperties::class)
class AppConfig {
    @Bean
    fun webClient(): WebClient = WebClient.builder().build()
}
