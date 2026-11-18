package com.aksharmarbles.exception;

public class ConflictException extends AppException {

    public ConflictException(String message) {
        super("CONFLICT", 409, message);
    }
}
