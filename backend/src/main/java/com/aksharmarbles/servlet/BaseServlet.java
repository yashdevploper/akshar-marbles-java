package com.aksharmarbles.servlet;

import com.aksharmarbles.dto.ErrorResponse;
import com.aksharmarbles.exception.AppException;
import com.aksharmarbles.exception.ValidationException;
import com.aksharmarbles.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

public abstract class BaseServlet extends HttpServlet {

    protected final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    public void service(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            super.service(req, resp);
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    protected void sendJson(HttpServletResponse response, Object data) throws IOException {
        sendJson(response, HttpServletResponse.SC_OK, data);
    }

    protected void sendJson(HttpServletResponse response, int statusCode, Object data) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter writer = response.getWriter();
        writer.write(JsonUtil.toJson(data));
        writer.flush();
    }

    protected void sendError(HttpServletResponse response, int statusCode, String errorCode, String message, Map<String, String> fields) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        ErrorResponse err = new ErrorResponse(errorCode, message, fields);
        PrintWriter writer = response.getWriter();
        writer.write(JsonUtil.toJson(err));
        writer.flush();
    }

    protected void handleException(HttpServletResponse response, Exception e) throws IOException {
        if (e instanceof ValidationException ve) {
            logger.warn("Validation error: {}", ve.getMessage());
            sendError(response, ve.getStatusCode(), ve.getErrorCode(), ve.getMessage(), ve.getFieldErrors());
        } else if (e instanceof AppException ae) {
            logger.warn("Application error [{}]: {}", ae.getErrorCode(), ae.getMessage());
            sendError(response, ae.getStatusCode(), ae.getErrorCode(), ae.getMessage(), null);
        } else {
            logger.error("Unhandled server exception: {}", e.getMessage(), e);
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", 
                    "An unexpected internal error occurred. Please try again later.", null);
        }
    }

    protected <T> T readJson(HttpServletRequest request, Class<T> clazz) throws IOException {
        return JsonUtil.fromJson(request.getInputStream(), clazz);
    }
}
