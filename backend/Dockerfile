# ==============================================================================
# Multi-Stage Dockerfile for Akshar Marbles (Render Web Service)
# Stage 1: Maven + Eclipse Temurin JDK 17 (Build)
# Stage 2: Apache Tomcat 10.1 + Eclipse Temurin Java 17 (Runtime)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build ROOT.war
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Pre-fetch dependencies where possible to leverage Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy the backend sources
COPY src ./src

# If application.properties is absent (due to .gitignore), populate it from the template
RUN if [ ! -f src/main/resources/application.properties ]; then \
        cp src/main/resources/application.properties.example src/main/resources/application.properties; \
    fi

# Compile and package production WAR
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime with Apache Tomcat 10.1
# ------------------------------------------------------------------------------
FROM tomcat:10.1-jdk17-temurin

WORKDIR /usr/local/tomcat

# Remove default Tomcat demo applications to keep image slim and secure
RUN rm -rf webapps/*

# Copy the compiled ROOT.war into Tomcat webapps directory as the root context
COPY --from=builder /build/target/ROOT.war webapps/ROOT.war

# Copy startup entrypoint script and sanitize line endings (CRLF -> LF)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# Optimize JVM memory flags for Render's 512 MB free tier instance:
# - Heap bounded to 128MB min / 300MB max to prevent Linux OOM-killer (exit 137)
# - ExitOnOutOfMemoryError ensures fail-fast restart on memory exhaustion
# - G1GC with low pause times for responsive API queries
ENV CATALINA_OPTS="-Xms128m -Xmx300m -XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"
ENV PORT=8080
ENV APP_ENVIRONMENT=production

# Render routes dynamic HTTP traffic to the container
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["catalina.sh", "run"]
