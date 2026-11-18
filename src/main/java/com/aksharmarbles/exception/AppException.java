package com.aksharmarbles.exception;

public class AppException extends RuntimeException {

    private final String errorCode;
    private final int statusCode;

    public AppException(String message) {
        this("INTERNAL_ERROR", 500, message);
    }

    public AppException(String errorCode, int statusCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
    }

    public AppException(String errorCode, int statusCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
