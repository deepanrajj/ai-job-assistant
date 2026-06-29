# Plan: task-002 — Add Flyway Migration Setup

## Context

The backend is a stateless Kotlin + Spring Boot 4 API with no database integration yet. PostgreSQL infrastructure is already provisioned in Kubernetes (`smartjobtracker` DB/user), but the backend has no driver, no ORM, and no migration tooling. This task wires in Flyway so that all future schema changes go through versioned migration scripts, satisfying the project rule: *no DB schema without Flyway*.

---

## Files to Modify / Create

### 1. `backend/build.gradle.kts`
Add dependencies:
```kotlin
runtimeOnly("org.postgresql:postgresql")
implementation("org.flywaydb:flyway-core")
runtimeOnly("org.flywaydb:flyway-database-postgresql")   // required by Flyway 10+ for PG
testRuntimeOnly("com.h2database:h2")
```

### 2. `backend/src/main/resources/application.properties`
Append datasource + Flyway config (env-var driven, with local defaults):
```properties
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/smartjobtracker}
spring.datasource.username=${DB_USER:smartjobtracker}
spring.datasource.password=${DB_PASSWORD:smartjobtracker}
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
```

### 3. `backend/src/test/resources/application.properties` *(create)*
Override datasource for tests with H2 in PostgreSQL-compatibility mode so existing tests keep working without a live DB:
```properties
spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.flyway.enabled=true
```

### 4. `backend/src/main/resources/db/migration/V1__baseline.sql` *(create)*
First migration — an intentional no-op baseline that marks the schema origin:
```sql
-- baseline: schema origin for smart-job-tracker
-- subsequent migrations add tables incrementally
```

### 5. `backend/src/test/kotlin/com/smartjobtracker/FlywayMigrationTest.kt` *(create)*
Integration test that loads the full Spring context (with H2) and asserts Flyway applied the baseline migration:
```kotlin
@SpringBootTest
class FlywayMigrationTest {
    @Autowired lateinit var flyway: Flyway

    @Test
    fun `flyway migrations apply cleanly on startup`() {
        val info = flyway.info()
        assertThat(info.applied()).isNotEmpty()
        assertThat(info.pending()).isEmpty()
    }
}
```

---

## Migration Naming Convention (for future migrations)
```
V<version>__<snake_case_description>.sql

V1__baseline.sql
V2__create_jobs_table.sql
V3__add_job_status_column.sql
```

---

## Verification

1. `npm run backend:verify` — ktlint, detekt, JaCoCo, and all tests green.
2. Confirm log line `Successfully applied 1 migration to schema "public"` when running locally with a live DB.
3. Existing tests (`AiControllerTest`, `AiServiceTest`, etc.) must still pass — they use H2 in tests.

---

## Out of Scope
- No JPA entities or repositories (next task).
- No new domain tables in V1 (V1 is a baseline only).
- No changes to infra/k8s — PostgreSQL deployment already exists.
