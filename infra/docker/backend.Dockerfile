FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

COPY backend/gradlew backend/settings.gradle.kts backend/build.gradle.kts ./
COPY backend/gradle ./gradle
COPY backend/src ./src

RUN chmod +x ./gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /workspace/build/libs/*.jar app.jar

USER app

EXPOSE 4000

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
