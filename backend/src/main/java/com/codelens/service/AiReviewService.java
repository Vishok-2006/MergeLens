package com.codelens.service;

import com.codelens.ai.dto.AiResponse;
import com.codelens.ai.service.AIOrchestratorService;
import com.codelens.ai.service.AiUnavailableException;
import com.codelens.entity.PullRequestEntity;
import com.codelens.entity.ReviewCommentEntity;
import com.codelens.entity.ReviewScoreEntity;
import com.codelens.repo.ReviewCommentRepo;
import com.codelens.repo.ReviewScoreRepo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Orchestrates the AI code review pipeline.
 *
 * <p>Delegates all AI calls to {@link AIOrchestratorService} — never talks to a
 * provider directly. Persists review comments and scores to the database.
 */
@Service
@RequiredArgsConstructor
public class AiReviewService {

    private static final Logger log = LoggerFactory.getLogger(AiReviewService.class);

    private final AIOrchestratorService orchestrator;
    private final ReviewCommentRepo comments;
    private final ReviewScoreRepo scores;
    private final ObjectMapper mapper;

    /**
     * Run an AI review for the given pull request.
     *
     * @param pr      The pull request entity.
     * @param diff    Raw diff text from GitHub.
     * @param context Relevant code snippets retrieved from Qdrant.
     */
    public void review(PullRequestEntity pr, String diff, List<String> context) {
        log.info("[Review] Starting AI review | pullRequestId={} title={}", pr.getId(), pr.getTitle());

        String raw;
        try {
            AiResponse response = orchestrator.review(diff, context);
            raw = response.content();
            log.info("[Review] AI review complete | provider={} model={} latency={}ms fallback={}",
                    response.providerName(), response.modelName(), response.latencyMs(), response.fallback());
        } catch (AiUnavailableException ex) {
            log.error("[Review] AI unavailable | reason={}", ex.getMessage());
            raw = fallbackJson();
        }

        persist(pr, raw);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void persist(PullRequestEntity pr, String raw) {
        try {
            String json = extractJson(raw);
            JsonNode root = mapper.readTree(json);

            for (JsonNode c : root.path("comments")) {
                ReviewCommentEntity e = new ReviewCommentEntity();
                e.setPullRequest(pr);
                e.setFilePath(c.path("file").asText(""));
                e.setLineNumber(c.path("line").asInt(1));
                e.setSeverity(c.path("severity").asText("medium"));
                e.setMessage(c.path("message").asText("AI review comment"));
                comments.save(e);
            }

            ReviewScoreEntity s = scores.findByPullRequestId(pr.getId()).orElseGet(ReviewScoreEntity::new);
            s.setPullRequest(pr);
            JsonNode sc = root.path("scores");
            s.setSecurityScore(sc.path("security").asInt(50));
            s.setQualityScore(sc.path("quality").asInt(50));
            s.setComplexityScore(sc.path("complexity").asInt(50));
            scores.save(s);

            log.info("[Review] Persisted review | pullRequestId={} comments={} scores=s/q/c:{}/{}/{}",
                    pr.getId(), root.path("comments").size(),
                    s.getSecurityScore(), s.getQualityScore(), s.getComplexityScore());
        } catch (Exception e) {
            log.error("[Review] JSON parse failed | pullRequestId={} error={}", pr.getId(), e.getMessage());
        }
    }

    private String extractJson(String raw) {
        String s = raw == null ? "{}" : raw;
        // Strip markdown code fences if present
        Matcher m = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE).matcher(s);
        if (m.find()) s = m.group(1);
        int a = s.indexOf('{'), b = s.lastIndexOf('}');
        return (a >= 0 && b > a) ? s.substring(a, b + 1) : s;
    }

    private String fallbackJson() {
        return "{\"comments\":[],\"scores\":{\"security\":50,\"quality\":50,\"complexity\":50}}";
    }
}
