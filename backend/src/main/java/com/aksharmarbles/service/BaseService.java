package com.aksharmarbles.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class BaseService {

    protected final Logger logger = LoggerFactory.getLogger(getClass());

    protected void validateNotNull(Object obj, String fieldName) {
        if (obj == null) {
            throw new IllegalArgumentException(fieldName + " cannot be null.");
        }
    }

    protected void validateNotEmpty(String str, String fieldName) {
        if (str == null || str.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " cannot be blank.");
        }
    }
}
