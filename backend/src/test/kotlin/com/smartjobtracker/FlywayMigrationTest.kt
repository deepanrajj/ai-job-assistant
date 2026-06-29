package com.smartjobtracker

import org.assertj.core.api.Assertions.assertThat
import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class FlywayMigrationTest {
    @Autowired
    lateinit var flyway: Flyway

    @Test
    fun `flyway migrations apply cleanly on startup`() {
        val info = flyway.info()
        assertThat(info.applied()).isNotEmpty()
        assertThat(info.pending()).isEmpty()
    }
}
