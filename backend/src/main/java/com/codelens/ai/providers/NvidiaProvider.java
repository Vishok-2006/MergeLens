package com.codelens.ai.providers;

import com.codelens.config.AiProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * NVIDIA NIM provider — Primary AI.
 * Configuration is sourced from AiProperties (bound from app.ai.nvidia.*).
 */
@Component
public class NvidiaProvider extends AbstractOpenAiProvider {

    public NvidiaProvider(RestTemplate restTemplate, AiProperties aiProperties) {
        super(
                restTemplate,
                aiProperties.nvidia().baseUrl(),
                aiProperties.nvidia().apiKey(),
                aiProperties.nvidia().chatModel(),
                aiProperties.nvidia().embeddingModel()
        );
    }

    @Override
    public String providerName() {
        return "NVIDIA";
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isBlank() && !baseUrl.isBlank() && !chatModel.isBlank();
    }
}
