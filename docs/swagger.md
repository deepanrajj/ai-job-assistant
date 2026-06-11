# Swagger and OpenAPI

The backend generates OpenAPI documentation with Springdoc instead of maintaining a manual endpoint list.

## What We Use

The backend uses Spring MVC controllers and WebClient for outbound OpenAI calls, so the Swagger dependency is the Springdoc WebMVC UI starter:

```kotlin
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.3")
```

Springdoc's compatibility matrix maps Spring Boot `4.x.x` to Springdoc OpenAPI `3.x.x`, and Maven Central currently lists `3.0.3` as the latest release for `springdoc-openapi-starter-webmvc-ui`.

## Backend Configuration

OpenAPI metadata is configured in:

```text
backend/src/main/kotlin/com/smartjobtracker/config/OpenApiConfig.kt
```

This gives the generated documentation a clear API title, description, and version.

## Local URLs

The backend uses:

```properties
server.servlet.context-path=/api
```

Default Swagger URLs:

```text
http://localhost:4000/api/swagger-ui.html
http://localhost:4000/api/v3/api-docs
http://localhost:4000/api/v3/api-docs.yaml
```

## Kubernetes URLs

When running through the local Kubernetes frontend service, Nginx proxies `/api/*` to the backend.

```text
http://localhost:30080/api/swagger-ui.html
http://localhost:30080/api/v3/api-docs
http://localhost:30080/api/v3/api-docs.yaml
```

If Swagger UI opens but requests point to the wrong server, add forwarded-header handling or explicit OpenAPI server configuration.

## How To Verify

Run the backend checks:

```bash
npm run backend:verify
```

Or run the backend directly:

```bash
npm run dev:backend
```

Then open:

```text
http://localhost:4000/api/swagger-ui.html
```

## Test Coverage

The generated OpenAPI endpoint is covered by:

```text
backend/src/test/kotlin/com/smartjobtracker/config/OpenApiConfigTest.kt
```

The test verifies that `/api/v3/api-docs` returns API metadata and includes the current AI health route.

## Adding Better Endpoint Documentation Later

Springdoc can generate useful documentation from controllers and DTOs without many annotations. Add annotations only when they make the generated docs clearer:

```kotlin
@Operation(summary = "Analyze a job description")
```

For response descriptions:

```kotlin
@ApiResponse(responseCode = "200", description = "Job analysis returned")
```

Do not over-annotate early. Let controller method names, request DTOs, and response DTOs do most of the work.

## Sources

- [Springdoc documentation](https://springdoc.org/)
- [Springdoc WebMVC UI Maven metadata](https://repo.maven.apache.org/maven2/org/springdoc/springdoc-openapi-starter-webmvc-ui/maven-metadata.xml)
