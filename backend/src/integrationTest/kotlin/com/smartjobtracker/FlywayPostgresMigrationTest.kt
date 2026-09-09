package com.smartjobtracker

import com.smartjobtracker.testsupport.containers.PostgresContainerConfiguration
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional

/**
 * The migrations under test are the same ones `FlywayMigrationTest`
 * checks, but that test runs on H2 in PostgreSQL mode, which is a
 * compatibility approximation rather than PostgreSQL. Anything H2
 * accepts and PostgreSQL rejects passes there and fails on deploy.
 */
@SpringBootTest
@Import(PostgresContainerConfiguration::class)
class FlywayPostgresMigrationTest {
    @Autowired
    lateinit var flyway: Flyway

    @PersistenceContext
    lateinit var entityManager: EntityManager

    @Test
    fun `migrations apply cleanly to a real postgres database`() {
        val info = flyway.info()

        assertThat(info.applied()).isNotEmpty()
        assertThat(info.pending()).isEmpty()
    }

    @Test
    @Transactional
    fun `the database under test really is postgres`() {
        // Guards against the container silently not being used. Every
        // other assertion in this source set is worthless if these tests
        // quietly fall back to H2.
        val product =
            entityManager
                .createNativeQuery("select version()")
                .singleResult as String

        assertThat(product).startsWith("PostgreSQL 16")
    }

    @Test
    @Transactional
    fun `the migrated schema exposes the expected tables`() {
        @Suppress("UNCHECKED_CAST")
        val tables =
            entityManager
                .createNativeQuery(
                    "select table_name from information_schema.tables where table_schema = 'public'",
                ).resultList as List<String>

        assertThat(tables).contains("jobs", "tasks")
    }
}
