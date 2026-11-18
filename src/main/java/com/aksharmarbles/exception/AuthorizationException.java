package com.aksharmarbles.exception;

public class AuthorizationException extends AppException {

    public AuthorizationException(String message) {
        super("ACCESS_DENIED", 403, message);
    }
}
