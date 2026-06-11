package com.smartjobtracker.testsupport.ai

import org.springframework.web.reactive.function.client.WebClientException

class TestWebClientException : WebClientException("Network failed")
