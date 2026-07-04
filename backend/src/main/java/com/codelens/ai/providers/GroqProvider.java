package com.codelens.ai.providers;

import com.codelens.config.AiProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Groq provider — Fallback AI.
 * Configuration is sourced from AiProperties (bound from app.ai.groq.*).
 */
@Component
public class GroqProvider extends AbstractOpenAiProvider {

    public GroqProvider(RestTemplate restTemplate, AiProperties aiProperties) {
        super(
                restTemplate,
                aiProperties.groq().baseUrl(),
                aiProperties.groq().apiKey(),
                aiProperties.groq().model(),
                "" // Groq does not expose an embedding endpoint
        );
    }

    @Override
    public String providerName() {
        return "Groq";
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isBlank() && !baseUrl.isBlank() && !chatModel.isBlank();
    }
}
