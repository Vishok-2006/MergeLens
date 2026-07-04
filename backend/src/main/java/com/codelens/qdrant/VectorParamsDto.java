package com.codelens.qdrant;

/**
 * Single-vector configuration for {@code PUT /collections/{name}} (Qdrant 1.18).
 */
public record VectorParamsDto(int size, QdrantDistance distance) {
}
