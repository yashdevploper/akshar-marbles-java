package com.aksharmarbles.servlet;

import com.aksharmarbles.config.AppConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health check servlet serving container liveness and optional database readiness probes.
 * 
 * Liveness (Render health check path: /api/health):
 * - Guarantees fast, non-blocking HTTP 200 response when the container and webapp are running.
 * - Does NOT initialize Hibernate, does NOT open database sessions, and does NOT execute DB queries.
 * 
 * Readiness (optional: /api/health?probe=readiness or /api/health/ready):
 * - Performs a standalone, safe JDBC ping without triggering Hibernate's static initializer.
 * - Handles connection failures safely without crashing or exposing credentials.
 */
@WebServlet(name = "HealthCheckServlet", urlPatterns = {"/api/health", "/api/health/ready"})
public class HealthCheckServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        String probe = req.getParameter("probe");

        boolean isReadinessProbe = "readiness".equalsIgnoreCase(probe) 
                || (req.getServletPath() != null && req.getServletPath().endsWith("/ready"))
                || (pathInfo != null && pathInfo.contains("ready"));

        Map<String, Object> responseBody = new LinkedHashMap<>();
        responseBody.put("status", "UP");
        responseBody.put("service", "Akshar Marbles Backend API");
        responseBody.put("timestamp", Instant.now().toString());

        if (isReadinessProbe) {
            handleReadinessProbe(resp, responseBody);
        } else {
            // Pure liveness check for Render: zero DB calls, instant 200 OK
            sendJson(resp, HttpServletResponse.SC_OK, responseBody);
        }
    }

    private void handleReadinessProbe(HttpServletResponse resp, Map<String, Object> responseBody) throws IOException {
        boolean dbReady = checkDatabaseConnectivitySafe();
        if (dbReady) {
            responseBody.put("database", "CONNECTED");
            sendJson(resp, HttpServletResponse.SC_OK, responseBody);
        } else {
            responseBody.put("status", "DEGRADED");
            responseBody.put("database", "UNAVAILABLE");
            sendJson(resp, HttpServletResponse.SC_SERVICE_UNAVAILABLE, responseBody);
        }
    }

    /**
     * Tests database connectivity using direct lightweight JDBC with strict timeouts.
     * Crucially avoids HibernateUtil so that a database outage never triggers a fatal
     * ExceptionInInitializerError or NoClassDefFoundError.
     */
    private boolean checkDatabaseConnectivitySafe() {
        String url = AppConfig.get("db.url");
        String user = AppConfig.get("db.username", "root");
        String pass = AppConfig.get("db.password", "");

        if (url == null || url.trim().isEmpty()) {
            return false;
        }

        try {
            DriverManager.setLoginTimeout(3);
            try (Connection conn = DriverManager.getConnection(url, user, pass);
                 Statement stmt = conn.createStatement()) {
                stmt.setQueryTimeout(3);
                return stmt.execute("SELECT 1");
            }
        } catch (Throwable t) {
            // Log only safe sanitized message; never log credentials or full stack traces
            logger.warn("Readiness probe: Database ping failed: {}", t.getClass().getSimpleName());
            return false;
        }
    }
}
