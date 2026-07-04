package com.codelens.service;

import java.util.Map;

public record VectorSearchResult(String id, double score, Map<String, Object> payload) {
    public String text() {
        Object text = payload == null ? null : payload.get("text");
        return text == null ? "" : String.valueOf(text);
    }
}
