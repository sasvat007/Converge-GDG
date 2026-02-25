# Multi-stage Dockerfile for building and running the Spring Boot application

# --- Build stage: use Maven with JDK 17 to build the fat JAR ---
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /workspace

# Use the Maven wrapper if present, copy wrapper and settings first to leverage cache
COPY .mvn/ .mvn/
COPY mvnw mvnw
RUN chmod +x mvnw || true

# Copy pom and download dependencies (improves build cache)
COPY pom.xml .
RUN ./mvnw -B -ntp -DskipTests dependency:go-offline || mvn -B -ntp -DskipTests dependency:go-offline

# Copy source and build the application (skip tests by default for faster image builds)
COPY src ./src
RUN ./mvnw -B -DskipTests package --no-transfer-progress

# --- Runtime stage: smaller image with only the JRE ---
FROM eclipse-temurin:17-jre-jammy

LABEL org.opencontainers.image.source="https://example.com/your-repo"
LABEL maintainer="maintainer@example.com"

WORKDIR /app

# Copy the jar produced in the build stage. The wildcard will pick the built jar.
COPY --from=build /workspace/target/*.jar app.jar

# Use a non-root user for runtime
RUN useradd -m appuser || true
USER appuser

# Expose the default Spring Boot port
EXPOSE 8080

# Provide a place to pass tunable JVM options at container runtime
ENV JAVA_OPTS="-Xms256m -Xmx512m"

# Start the application
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
