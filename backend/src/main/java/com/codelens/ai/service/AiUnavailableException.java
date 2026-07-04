package com.codelens.ai.service;

/**
 * Thrown when no AI provider is available or all providers have failed.
 */
public class AiUnavailableException extends Exception {
    public AiUnavailableException(String message) {
        super(message);
    }
}
