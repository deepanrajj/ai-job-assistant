package com.smartjobtracker.ai

import com.smartjobtracker.ai.dto.AnalyzeJobRequest
import com.smartjobtracker.ai.dto.AnalyzeJobResponse
import com.smartjobtracker.ai.dto.AskJobRequest
import com.smartjobtracker.ai.dto.AskJobResponse
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/ai")
class AiController(
    private val aiService: AiService,
) {
    @GetMapping("health")
    fun health(): Map<String, Boolean> = mapOf("ok" to true)

    @PostMapping("/analyze-job")
    fun analyzeJob(
        @Valid @RequestBody request: AnalyzeJobRequest,
    ): AnalyzeJobResponse = aiService.analyzeJob(request)

    @PostMapping("/ask-job")
    fun askJob(
        @Valid @RequestBody request: AskJobRequest,
    ): AskJobResponse = aiService.askJob(request)
}
