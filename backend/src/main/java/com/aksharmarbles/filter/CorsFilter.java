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
        String allowed = (configuredOrigin != null && !configuredOrigin.trim().isEmpty())
                ? configuredOrigin.trim()
                : "*";

        if (origin != null && !origin.trim().isEmpty()) {
            boolean allowAll = "*".equals(allowed);
            if (allowAll || allowed.equalsIgnoreCase(origin.trim())) {
                httpResponse.setHeader("Access-Control-Allow-Origin", origin.trim());
                httpResponse.setHeader("Vary", "Origin");
                httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
            }
        }
        httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        httpResponse.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-CSRF-Token");

        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }
        chain.doFilter(request, response);
    }
}
