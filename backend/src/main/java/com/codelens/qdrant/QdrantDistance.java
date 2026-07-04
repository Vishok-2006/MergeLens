package com.codelens.qdrant;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Distance metric accepted by the Qdrant REST API (v1.18).
 */
public enum QdrantDistance {
    Cosine,
    Euclid,
    Dot,
    Manhattan;

    @JsonValue
    public String apiValue() {
        return name();
    }

    public static QdrantDistance fromConfig(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("QDRANT_DISTANCE must not be blank");
        }
        String normalized = raw.trim();
        for (QdrantDistance distance : values()) {
            if (distance.name().equalsIgnoreCase(normalized)) {
                return distance;
            }
        }
        throw new IllegalArgumentException(
                "Invalid QDRANT_DISTANCE '" + raw + "'. Use Cosine, Euclid, Dot, or Manhattan.");
    }
}
