package com.codelens.ai.providers;

import com.codelens.ai.dto.AiResponse;
import com.codelens.ai.dto.ProviderStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Shared logic for all OpenAI-compatible REST APIs.
 * Extend this class to add a new provider — only the config values differ.
 */
public abstract class AbstractOpenAiProvider implements AIProvider {

    protected final Logger log = LoggerFactory.getLogger(getClass());

    protected final RestTemplate rest;
    protected final String baseUrl;
    protected final String apiKey;
    protected final String chatModel;
    protected final String embeddingModelName;

    protected AbstractOpenAiProvider(RestTemplate rest, String baseUrl, String apiKey,
                                     String chatModel, String embeddingModelName) {
        this.rest = rest;
        this.baseUrl = baseUrl != null ? baseUrl.stripTrailing() : "";
        this.apiKey = apiKey != null ? apiKey.strip() : "";
        this.chatModel = chatModel != null ? chatModel.strip() : "";
        this.embeddingModelName = embeddingModelName != null ? embeddingModelName.strip() : "";
    }

    @Override
    public String modelName() {
        return chatModel;
    }

    @Override
    public String embeddingModel() {
        return embeddingModelName;
    }
    @Override
    public boolean isHealthy() {
        return getStatus().healthy();
    }

    @Override
    public ProviderStatus getStatus() {
        if (!isConfigured()) {
            return new ProviderStatus(
                    providerName(),
                    false,
                    false,
                    "NOT_CONFIGURED",
                    "API key or configuration missing.",
                    null,
                    chatModel,
                    embeddingModelName
            );
        }

        long start = System.currentTimeMillis();
        try {
            complete("You are a health-check assistant. Reply with one word.", "ping");
            long latency = System.currentTimeMillis() - start;
            
            log.info("[{}] Health status: CONNECTED | Latency = {} ms", providerName(), latency);

            return new ProviderStatus(
                    providerName(),
                    true,
                    true,
                    "CONNECTED",
                    "Connected",
                    latency,
                    chatModel,
                    embeddingModelName
            );
        } catch (Exception ex) {
            String state = "ERROR";
            String message = ex.getMessage();
            
            // Check for HttpStatusCodeException or ResourceAccessException in cause chain
            Throwable cause = ex;
            while (cause != null && !(cause instanceof org.springframework.web.client.HttpStatusCodeException)
                    && !(cause instanceof org.springframework.web.client.ResourceAccessException)) {
                cause = cause.getCause();
            }

            if (cause instanceof org.springframework.web.client.HttpStatusCodeException hse) {
                int status = hse.getStatusCode().value();
                if (status == 429) {
                    state = "RATE_LIMITED";
                    String retryAfter = null;
                    var headers = hse.getResponseHeaders();
                    if (headers != null) {
                        retryAfter = headers.getFirst("Retry-After");
                    }
                    if (retryAfter != null && !retryAfter.isBlank()) {
                        message = providerName() + " API rate limit exceeded. Retry in " + retryAfter + " seconds.";
                        log.warn("[{}] Health status: RATE_LIMITED | Retry After = {} s", providerName(), retryAfter);
                    } else {
                        message = providerName() + " API rate limit exceeded.";
                        log.warn("[{}] Health status: RATE_LIMITED", providerName());
                    }
                } else if (status == 401) {
                    state = "UNAUTHORIZED";
                    message = "Unauthorized: Invalid API key.";
                    log.warn("[{}] Health status: UNAUTHORIZED", providerName());
                } else if (status == 504 || status == 503) {
                    state = "TIMEOUT";
                    message = "Gateway timeout / Service temporarily unavailable.";
                    log.warn("[{}] Health status: TIMEOUT", providerName());
                } else {
                    state = "UNAVAILABLE";
                    message = "HTTP " + status + ": " + hse.getStatusText();
                    log.warn("[{}] Health status: UNAVAILABLE | HTTP {}", providerName(), status);
                }
            } else if (cause instanceof org.springframework.web.client.ResourceAccessException) {
                state = "TIMEOUT";
                message = "Connection timed out.";
                log.warn("[{}] Health status: TIMEOUT", providerName());
            } else {
                log.warn("[{}] Health status: ERROR | {}", providerName(), message);
            }

            return new ProviderStatus(
                    providerName(),
                    true,
                    false,
                    state,
                    message,
                    null,
                    chatModel,
                    embeddingModelName
            );
        }
    }

    @Override
    public AiResponse complete(String systemPrompt, String userPrompt) throws Exception {
        assertConfigured();
        long start = System.currentTimeMillis();

        Map<String, Object> request = Map.of(
                "model", chatModel,
                "temperature", 0.1,
                "max_tokens", 4096,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        log.debug("[{}] POST {}/chat/completions model={}", providerName(), baseUrl, chatModel);
        Map<?, ?> response = rest.postForObject(
                baseUrl + "/chat/completions",
                new HttpEntity<>(request, buildHeaders()),
                Map.class
        );
        long latency = System.currentTimeMillis() - start;

        if (response == null) {
            throw new IllegalStateException(providerName() + " returned null response");
        }

        Object choices = response.get("choices");
        if (!(choices instanceof List<?> list) || list.isEmpty()) {
            throw new IllegalStateException(providerName() + " returned empty choices");
        }

        Object message = ((Map<?, ?>) list.getFirst()).get("message");
        String content = message instanceof Map<?, ?> m ? String.valueOf(m.get("content")) : String.valueOf(message);

        int promptTokens = 0, completionTokens = 0;
        Object usage = response.get("usage");
        if (usage instanceof Map<?, ?> u) {
            promptTokens = toInt(u.get("prompt_tokens"));
            completionTokens = toInt(u.get("completion_tokens"));
        }

        log.debug("[{}] Response: latency={}ms promptTokens={} completionTokens={}",
                providerName(), latency, promptTokens, completionTokens);

        return new AiResponse(providerName(), chatModel, content, latency, promptTokens, completionTokens, false);
    }

    @Override
    public List<Double> embed(String input) throws Exception {
        assertConfigured();
        if (embeddingModelName == null || embeddingModelName.isBlank()) {
            throw new IllegalStateException(providerName() + " embedding model is not configured");
        }

        Map<String, Object> request = Map.of(
                "model", embeddingModelName,
                "input", input == null ? "" : input
        );

        log.debug("[{}] POST {}/embeddings model={}", providerName(), baseUrl, embeddingModelName);
        Map<?, ?> response = rest.postForObject(
                baseUrl + "/embeddings",
                new HttpEntity<>(request, buildHeaders()),
                Map.class
        );

        if (response == null) {
            throw new IllegalStateException(providerName() + " returned null embedding response");
        }

        Object data = response.get("data");
        if (!(data instanceof List<?> list) || list.isEmpty()) {
            throw new IllegalStateException(providerName() + " returned empty embedding data");
        }

        Object embedding = ((Map<?, ?>) list.getFirst()).get("embedding");
        if (!(embedding instanceof List<?> values)) {
            throw new IllegalStateException(providerName() + " embedding payload is invalid");
        }

        List<Double> vector = new ArrayList<>(values.size());
        for (Object value : values) {
            vector.add(((Number) value).doubleValue());
        }
        return vector;
    }

    protected HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        return headers;
    }

    protected void assertConfigured() {
        if (!isConfigured()) {
            throw new IllegalStateException(providerName() + " is not configured — check API key, base URL, and model");
        }
    }

    private int toInt(Object o) {
        return o instanceof Number n ? n.intValue() : 0;
    }
}
