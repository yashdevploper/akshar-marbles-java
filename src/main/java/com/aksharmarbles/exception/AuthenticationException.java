package com.aksharmarbles.exception;

public class AuthenticationException extends AppException {

    public AuthenticationException(String message) {
        super("AUTHENTICATION_REQUIRED", 401, message);
    }
}
