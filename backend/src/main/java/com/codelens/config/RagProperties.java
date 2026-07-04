package com.codelens.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rag")
public record RagProperties(
        int topKResults,
        double similarityThreshold,
        int maxChunkSize,
        int chunkOverlap
) {
}
