package com.taskflow.service;

import java.util.Collections;
import java.util.List;

public class ValidationException extends Exception {
    private final List<String> errors;

    public ValidationException(String message) {
        super(message);
        this.errors = Collections.singletonList(message);
    }

    public ValidationException(List<String> errors) {
        super(String.join(", ", errors));
        this.errors = errors != null ? errors : Collections.emptyList();
    }

    public List<String> getErrors() {
        return errors;
    }
}
