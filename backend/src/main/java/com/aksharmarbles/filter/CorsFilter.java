package com.aksharmarbles.filter;

import com.aksharmarbles.config.AppConfig;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebFilter(filterName = "CorsFilter", urlPatterns = {"/api/*"})
public class CorsFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String origin = httpRequest.getHeader("Origin");
        String configuredOrigin = AppConfig.get("cors.allowedOrigin");

        if (origin != null && (configuredOrigin == null || configuredOrigin.trim().isEmpty()
                || "*".equals(configuredOrigin.trim()) || configuredOrigin.trim().equalsIgnoreCase(origin))) {
            httpResponse.setHeader("Access-Control-Allow-Origin",
                    "*".equals(configuredOrigin.trim()) ? "*" : origin);
            httpResponse.setHeader("Vary", "Origin");
        }
        if (origin != null && (configuredOrigin == null || configuredOrigin.trim().isEmpty()
                || "*".equals(configuredOrigin.trim()) || configuredOrigin.trim().equalsIgnoreCase(origin))) {
            httpResponse.setHeader("Access-Control-Allow-Credentials",
                    "*".equals(configuredOrigin == null ? "" : configuredOrigin.trim()) ? "false" : "true");
        }
        httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        httpResponse.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-CSRF-Token");

        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }
        chain.doFilter(request, response);
    }
}
