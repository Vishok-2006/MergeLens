package com.codelens.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates required environment variables at startup and emits a clear AI config log.
 * Fails fast with a meaningful message if required infrastructure config is missing.
 */
@Component
@RequiredArgsConstructor
public class StartupValidation {

    private static final Logger log = LoggerFactory.getLogger(StartupValidation.class);
    private final Environment environment;

    @PostConstruct
    void validateRequiredEnvironment() {
        List<String> missing = new ArrayList<>();

        // ── Infrastructure ────────────────────────────────────────────────────
        require(missing, "QDRANT_URL");
        require(missing, "QDRANT_COLLECTION");
        require(missing, "QDRANT_VECTOR_SIZE");
        require(missing, "QDRANT_DISTANCE");
        require(missing, "TOP_K_RESULTS");
        require(missing, "MAX_CHUNK_SIZE");
        require(missing, "CHUNK_OVERLAP");

        // ── NVIDIA (required for embeddings) ──────────────────────────────────
        require(missing, "NVIDIA_BASE_URL");
        require(missing, "NVIDIA_CHAT_MODEL");
        require(missing, "NVIDIA_EMBEDDING_MODEL");

        if (!missing.isEmpty()) {
            throw new IllegalStateException("Missing required environment variables: " + String.join(", ", missing));
        }

        // ── AI Configuration summary (safe — never logs secrets) ──────────────
        String nvidiaKey  = environment.getProperty("NVIDIA_API_KEY",  "");
        String groqKey    = environment.getProperty("GROQ_API_KEY",    "");
        String nvidiaModel = environment.getProperty("NVIDIA_CHAT_MODEL", "");
        String groqModel   = environment.getProperty("GROQ_MODEL",       "");

        log.info("──────────────────────────────────────────");
        log.info("  Startup Validation");
        log.info("──────────────────────────────────────────");
        log.info("  AI Configuration");
        log.info("  ├─ NVIDIA Key      : {}", nvidiaKey.isBlank()  ? "MISSING" : "Loaded");
        log.info("  ├─ Groq Key        : {}", groqKey.isBlank()    ? "MISSING" : "Loaded");
        log.info("  ├─ NVIDIA Model    : {}", nvidiaModel.isBlank() ? "MISSING" : nvidiaModel);
        log.info("  ├─ Groq Model      : {}", groqModel.isBlank()   ? "Not configured" : groqModel);
        log.info("  ├─ Primary AI      : NVIDIA");
        log.info("  └─ Fallback AI     : Groq");
        log.info("  Qdrant collection  : {}", environment.getProperty("QDRANT_COLLECTION"));
        log.info("──────────────────────────────────────────");

        if (nvidiaKey.isBlank()) {
            log.warn("NVIDIA_API_KEY is missing — AI reviews and embeddings will not work until it is set.");
        }
    }

    private void require(List<String> missing, String key) {
        String value = environment.getProperty(key);
        if (value == null || value.isBlank()) missing.add(key);
    }
}
