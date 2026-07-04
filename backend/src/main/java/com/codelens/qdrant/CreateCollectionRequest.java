package com.codelens.qdrant;

/**
 * Request body for {@code PUT /collections/{collection_name}} (Qdrant 1.18).
 */
public record CreateCollectionRequest(VectorParamsDto vectors) {
}
