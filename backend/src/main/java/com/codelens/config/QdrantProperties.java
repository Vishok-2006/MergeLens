package com.codelens.config;

import com.codelens.qdrant.QdrantDistance;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.qdrant")
public record QdrantProperties(
        String url,
        String collection,
        int vectorSize,
        String distance,
        String apiKey
) {
    public QdrantDistance resolvedDistance() {
        return QdrantDistance.fromConfig(distance);
    }
}
