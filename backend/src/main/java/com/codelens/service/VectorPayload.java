package com.codelens.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

public record VectorPayload(
        String repository,
        Long repositoryId,
        Long pullRequestId,
        String commitSha,
        String fileName,
        String language,
        String author,
        int chunkIndex,
        Instant createdAt,
        String sourceType,
        String text
) {
    Map<String, Object> toMap() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("repository", repository);
        payload.put("repositoryId", repositoryId);
        payload.put("pullRequestId", pullRequestId);
        payload.put("commitSha", commitSha);
        payload.put("fileName", fileName);
        payload.put("language", language);
        payload.put("author", author);
        payload.put("chunkIndex", chunkIndex);
        payload.put("createdAt", createdAt == null ? Instant.now().toString() : createdAt.toString());
        payload.put("sourceType", sourceType);
        payload.put("text", text);
        return payload;
    }
}
