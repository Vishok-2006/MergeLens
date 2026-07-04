package com.codelens.service;

import com.codelens.config.QdrantProperties;
import com.codelens.config.RagProperties;
import com.codelens.qdrant.CreateCollectionRequest;
import com.codelens.qdrant.QdrantDistance;
import com.codelens.qdrant.VectorParamsDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class QdrantService {
    private static final Logger log = LoggerFactory.getLogger(QdrantService.class);

    private final RestTemplate rest;
    private final ObjectMapper objectMapper;
    private final QdrantProperties qdrantProperties;
    private final RagProperties ragProperties;

    @PostConstruct
    void initializeCollection() {
        if (collectionExists()) {
            log.info("Qdrant collection already exists: {}", qdrantProperties.collection());
            return;
        }
        createCollection();
    }

    public boolean collectionExists() {
        String url = collectionUrl();
        try {
            log.debug("Checking Qdrant collection existence: GET {}", url);
            ResponseEntity<Map> response = rest.exchange(url, HttpMethod.GET, entity(null), Map.class);
            log.debug("Qdrant collection {} exists (status={})", qdrantProperties.collection(), response.getStatusCode());
            return true;
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().value() == 404) {
                log.info("Qdrant collection {} does not exist yet", qdrantProperties.collection());
                return false;
            }
            log.error("Failed to check Qdrant collection {}: status={}, body={}",
                    qdrantProperties.collection(), ex.getStatusCode(), ex.getResponseBodyAsString());
            throw qdrantError("Unable to check Qdrant collection " + qdrantProperties.collection(), ex);
        } catch (RestClientException ex) {
            throw qdrantError("Unable to reach Qdrant while checking collection " + qdrantProperties.collection(), ex);
        }
    }

    public void createCollection() {
        QdrantDistance distance = qdrantProperties.resolvedDistance();
        int vectorSize = qdrantProperties.vectorSize();
        CreateCollectionRequest requestBody = new CreateCollectionRequest(new VectorParamsDto(vectorSize, distance));
        String url = collectionUrl();

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(requestBody);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize Qdrant create-collection request", ex);
        }

        log.info("Creating Qdrant collection: method=PUT url={} body={}", url, jsonBody);

        try {
            ResponseEntity<Map> response = rest.exchange(url, HttpMethod.PUT, entity(requestBody), Map.class);
            log.info("Created Qdrant collection {} (status={}, vectorSize={}, distance={})",
                    qdrantProperties.collection(), response.getStatusCode(), vectorSize, distance.apiValue());
        } catch (HttpStatusCodeException ex) {
            log.error("Qdrant create collection failed: method=PUT url={} requestBody={} status={} responseBody={}",
                    url, jsonBody, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw qdrantError("Failed to create Qdrant collection " + qdrantProperties.collection()
                    + ": " + ex.getResponseBodyAsString(), ex);
        } catch (RestClientException ex) {
            log.error("Qdrant create collection failed: method=PUT url={} requestBody={} error={}",
                    url, jsonBody, ex.getMessage());
            throw qdrantError("Failed to create Qdrant collection " + qdrantProperties.collection(), ex);
        }
    }

    public void upsertEmbedding(String id, List<Double> embedding, VectorPayload payload) {
        if (embedding == null || embedding.isEmpty()) throw new IllegalArgumentException("Embedding must not be empty");
        if (embedding.size() != qdrantProperties.vectorSize()) {
            throw new IllegalArgumentException("Embedding size " + embedding.size() + " does not match Qdrant vector size " + qdrantProperties.vectorSize());
        }
        Map<String, Object> point = new LinkedHashMap<>();
        point.put("id", id == null || id.isBlank() ? UUID.randomUUID().toString() : id);
        point.put("vector", embedding);
        point.put("payload", payload.toMap());
        rest.postForEntity(api("/collections/" + qdrantProperties.collection() + "/points?wait=true"), entity(Map.of("points", List.of(point))), Map.class);
        log.debug("Upserted Qdrant vector {} for PR {} source {}", point.get("id"), payload.pullRequestId(), payload.sourceType());
    }

    public List<VectorSearchResult> searchSimilar(List<Double> queryEmbedding, int topK) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("vector", queryEmbedding);
        request.put("limit", topK <= 0 ? ragProperties.topKResults() : topK);
        request.put("with_payload", true);
        request.put("score_threshold", ragProperties.similarityThreshold());
        ResponseEntity<Map> response = rest.postForEntity(api("/collections/" + qdrantProperties.collection() + "/points/search"), entity(request), Map.class);
        Object result = response.getBody() == null ? null : response.getBody().get("result");
        if (!(result instanceof List<?> rows)) return List.of();
        List<VectorSearchResult> out = new ArrayList<>();
        for (Object row : rows) {
            if (row instanceof Map<?, ?> item) {
                Object payload = item.get("payload");
                out.add(new VectorSearchResult(String.valueOf(item.get("id")), asDouble(item.get("score")), payload instanceof Map<?, ?> p ? (Map<String, Object>) p : Map.of()));
            }
        }
        return out;
    }

    public void deleteByPullRequest(Long pullRequestId) {
        deleteByFilter(Map.of("must", List.of(match("pullRequestId", pullRequestId))));
        log.info("Deleted Qdrant vectors for pullRequestId={}", pullRequestId);
    }

    public void deleteRepositoryVectors(Long repositoryId) {
        deleteByFilter(Map.of("must", List.of(match("repositoryId", repositoryId))));
        log.info("Deleted Qdrant vectors for repositoryId={}", repositoryId);
    }

    public List<String> chunk(String text) {
        String input = text == null ? "" : text;
        List<String> sections = new ArrayList<>();
        Matcher matcher = Pattern.compile("(?m)^diff --git .*?(?=^diff --git |\\z)", Pattern.DOTALL).matcher(input);
        while (matcher.find()) addOverlappingChunks(sections, matcher.group());
        if (sections.isEmpty() && !input.isBlank()) addOverlappingChunks(sections, input);
        return sections;
    }

    private void addOverlappingChunks(List<String> chunks, String text) {
        int max = Math.max(1, ragProperties.maxChunkSize());
        int overlap = Math.max(0, Math.min(ragProperties.chunkOverlap(), max - 1));
        for (int start = 0; start < text.length(); start += max - overlap) {
            chunks.add(text.substring(start, Math.min(text.length(), start + max)));
            if (start + max >= text.length()) break;
        }
    }

    private void deleteByFilter(Map<String, Object> filter) {
        rest.postForEntity(api("/collections/" + qdrantProperties.collection() + "/points/delete?wait=true"), entity(Map.of("filter", filter)), Map.class);
    }

    private Map<String, Object> match(String key, Object value) {
        return Map.of("key", key, "match", Map.of("value", value));
    }

    private HttpEntity<?> entity(Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (qdrantProperties.apiKey() != null && !qdrantProperties.apiKey().isBlank()) {
            headers.set("api-key", qdrantProperties.apiKey());
        }
        return new HttpEntity<>(body, headers);
    }

    private String collectionUrl() {
        return api("/collections/" + qdrantProperties.collection());
    }

    private String api(String path) {
        return qdrantProperties.url().replaceAll("/+$", "") + path;
    }

    private double asDouble(Object value) {
        return value instanceof Number n ? n.doubleValue() : 0.0;
    }

    private IllegalStateException qdrantError(String message, Exception cause) {
        return cause instanceof IllegalStateException ise ? ise : new IllegalStateException(message, cause);
    }
}
