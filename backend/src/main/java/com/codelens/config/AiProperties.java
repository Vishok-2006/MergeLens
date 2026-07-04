package com.codelens.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Strongly-typed configuration for all AI providers.
 * Bound from application.yml under prefix "app.ai".
 */
@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(
        String provider,
        long timeoutMs,
        NvidiaConfig nvidia,
        GroqConfig groq
) {
    public record NvidiaConfig(
            String baseUrl,
            String apiKey,
            String chatModel,
            String embeddingModel
    ) {
        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank()
                    && baseUrl != null && !baseUrl.isBlank()
                    && chatModel != null && !chatModel.isBlank();
        }
    }

    public record GroqConfig(
            String baseUrl,
            String apiKey,
            String model
    ) {
        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank()
                    && baseUrl != null && !baseUrl.isBlank()
                    && model != null && !model.isBlank();
        }
    }
}
