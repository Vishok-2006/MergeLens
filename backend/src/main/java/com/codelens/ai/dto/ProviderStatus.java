package com.codelens.ai.dto;

/**
 * Detailed health and configuration status for an AI provider.
 */
public record ProviderStatus(
        String name,
        boolean configured,
        boolean healthy,
        String state,
        String message,
        Long latency,
        String model,
        String embeddingModel
) {}
