package com.smartjobtracker.config

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Transactional

/**
 * Pins the one thing the browser needs from this application's CORS
 * policy: a request carrying the origin the app is actually served from
 * must be handled rather than refused.
 *
 * Browsers attach `Origin` to every request that is not GET or HEAD,
 * same-origin ones included, and both the Nginx and the Vite proxy
 * forward it. A registered CORS mapping therefore judges requests the
 * browser never treated as cross-origin, and refuses any whose origin is
 * not on its list. Nothing that omits the header can see this, which is
 * why `npm run api:test` and every `curl` check passed while the browser
 * could not write at all.
 *
 * The write case is the one that matters. The read case is here to show
 * the refusal was never about the verb: it was about the header, which a
 * same-origin GET simply does not carry.
 *
 * Each case also asserts the response carries no
 * `Access-Control-Allow-Origin`. Asserting only that the request is not
 * refused would stay green if someone answered a future 403 with
 * `allowedOrigins("*")`, which opens the API to every origin instead of
 * removing the check. The absence of that header is the real invariant:
 * this application performs no CORS processing at all, whatever origin
 * arrives.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CorsPolicyTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `a read carrying the deployed app origin is served`() {
        mockMvc
            .perform(get("/jobs").header(HttpHeaders.ORIGIN, DEPLOYED_APP_ORIGIN))
            .andExpect(status().isOk)
            .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN))
    }

    @Test
    fun `a write carrying the deployed app origin is served`() {
        mockMvc
            .perform(
                post("/jobs")
                    .header(HttpHeaders.ORIGIN, DEPLOYED_APP_ORIGIN)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "company": "Acme Corp",
                          "roleTitle": "Backend Engineer"
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isCreated)
            .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN))
    }

    private companion object {
        /**
         * The origin Nginx serves the app from in the Compose and
         * Kubernetes runtimes, and the one a browser therefore sends.
         */
        const val DEPLOYED_APP_ORIGIN = "http://localhost:30080"
    }
}
