package com.aksharmarbles.exception;

public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException(String message) {
        super("RESOURCE_NOT_FOUND", 404, message);
    }

    public ResourceNotFoundException(String resourceName, Object identifier) {
        super("RESOURCE_NOT_FOUND", 404, String.format("%s with identifier '%s' was not found.", resourceName, identifier));
    }
}
