package com.codelens.ai.dto;

/**
 * Immutable result from an AI provider call.
 */
public record AiResponse(
        String providerName,
        String modelName,
        String content,
        long latencyMs,
        int promptTokens,
        int completionTokens,
        boolean fallback
) {
    public static AiResponse of(String provider, String model, String content, long latencyMs) {
        return new AiResponse(provider, model, content, latencyMs, 0, 0, false);
    }

    public AiResponse asFallback() {
        return new AiResponse(providerName, modelName, content, latencyMs, promptTokens, completionTokens, true);
    }
}
