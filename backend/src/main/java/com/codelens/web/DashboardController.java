package com.codelens.web;

import com.codelens.ai.dto.AiResponse;
import com.codelens.ai.dto.ProviderStatus;
import com.codelens.ai.service.AIOrchestratorService;
import com.codelens.ai.service.AiUnavailableException;
import com.codelens.entity.*;
import com.codelens.repo.*;
import com.codelens.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.*;
import java.time.format.TextStyle;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${app.frontend-url}")
@RequiredArgsConstructor
public class DashboardController {

    private final RepositoryRepo repos;
    private final PullRequestRepo prs;
    private final ReviewCommentRepo comments;
    private final ReviewScoreRepo scores;
    private final GitHubClient gitHub;
    private final QdrantService qdrant;
    private final AIOrchestratorService orchestrator;   // ← orchestrator, not NvidiaNimProvider
    private final AiReviewService ai;
    private final RealtimeEventService realtime;

    // ── Correct @Value paths ──────────────────────────────────────────────────
    @Value("${app.github.token:}")
    String githubToken;

    @Value("${app.ai.nvidia.api-key:}")   // was "app.nvidia.api-key" — WRONG key → always blank
    String nvidiaKey;

    @Value("${app.qdrant.url:http://localhost:6333}")
    String qdrantUrl;

    // ── Standard CRUD endpoints ───────────────────────────────────────────────

    @GetMapping("/repositories")
    Object repositories() { return repos.findAll(); }

    @GetMapping("/pull-requests")
    Object pullRequests(@RequestParam(required = false) Long repositoryId) {
        return repositoryId == null
                ? prs.findTop50ByOrderByUpdatedAtDesc()
                : prs.findByRepositoryIdOrderByUpdatedAtDesc(repositoryId);
    }

    @GetMapping("/pull-requests/{id}")
    Object detail(@PathVariable Long id) {
        PullRequestEntity pr = prs.findById(id).orElseThrow();
        return Map.of("pr", pr, "comments", comments.findByPullRequestId(id),
                "scores", scores.findByPullRequestId(id).orElse(null));
    }

    @GetMapping("/pull-requests/{id}/diff")
    Object diff(@PathVariable Long id) {
        PullRequestEntity pr = prs.findById(id).orElseThrow();
        return Map.of("diff", gitHub.diff(pr.getDiffUrl()));
    }

    @PostMapping("/pull-requests/{id}/review")
    Object review(@PathVariable Long id) throws Exception {
        PullRequestEntity pr  = prs.findById(id).orElseThrow();
        String diff           = gitHub.diff(pr.getDiffUrl());
        String query          = pr.getTitle() + "\n" + Optional.ofNullable(pr.getSummary()).orElse("") + "\n" + diff;
        List<Double> embedding = orchestrator.embed(query);          // ← via orchestrator
        List<String> ctx      = qdrant.searchSimilar(embedding, 8).stream().map(VectorSearchResult::text).toList();
        ai.review(pr, diff, ctx);
        realtime.publish("review.completed", Map.of("pullRequestId", id, "title", pr.getTitle()));
        return detail(id);
    }

    // ── Dashboard & Analytics ─────────────────────────────────────────────────

    @GetMapping("/dashboard")
    Object dashboard() {
        List<PullRequestEntity> all = prs.findAll();
        List<ReviewScoreEntity> sc  = scores.findAll();
        long open       = all.stream().filter(p -> "open".equalsIgnoreCase(p.getState())).count();
        long merged     = all.stream().filter(p -> "closed".equalsIgnoreCase(p.getState()) || "merged".equalsIgnoreCase(p.getState())).count();
        long processing = all.stream().filter(p -> Optional.ofNullable(p.getStatus()).orElse("").contains("PROCESSING")).count();
        double avgQuality  = sc.stream().map(ReviewScoreEntity::getQualityScore).filter(Objects::nonNull).mapToInt(i -> i).average().orElse(0);
        double avgSecurity = sc.stream().map(ReviewScoreEntity::getSecurityScore).filter(Objects::nonNull).mapToInt(i -> i).average().orElse(0);
        long securityIssues = comments.findAll().stream().filter(c -> "high".equalsIgnoreCase(c.getSeverity())).count();
        return Map.of(
                "stats", Map.of("repositories", repos.count(), "openPrs", open, "mergedPrs", merged,
                        "aiReviews", sc.size(), "averageReviewScore", Math.round(avgQuality),
                        "securityIssues", securityIssues, "performanceIssues", 0,
                        "codeSmells", comments.count(), "pendingReviews", processing),
                "processingQueue", all.stream().filter(p -> !"COMPLETED".equalsIgnoreCase(p.getStatus())).limit(10).toList(),
                "recentActivity",  all.stream().sorted(Comparator.comparing(PullRequestEntity::getUpdatedAt).reversed()).limit(10).toList(),
                "health", Map.of("quality", Math.round(avgQuality), "security", Math.round(avgSecurity), "repositories", repos.count())
        );
    }

    @GetMapping("/analytics")
    Object analytics() {
        List<PullRequestEntity> all = prs.findAll();
        List<ReviewScoreEntity> sc  = scores.findAll();
        Map<LocalDate, Long> byDay = all.stream()
                .collect(Collectors.groupingBy(p -> LocalDate.ofInstant(p.getCreatedAt(), ZoneOffset.UTC), TreeMap::new, Collectors.counting()));
        List<Map<String, Object>> prsPerDay = byDay.entrySet().stream().map(e -> row("day", e.getKey().toString(), "prs", e.getValue())).toList();
        List<Map<String, Object>> quality   = sc.stream().map(s -> row("pr", "#" + s.getPullRequest().getNumber(), "quality", nz(s.getQualityScore()), "security", nz(s.getSecurityScore()), "complexity", nz(s.getComplexityScore()))).toList();
        Map<String, Long> languages    = all.stream().flatMap(p -> Optional.ofNullable(p.getFilesChanged()).orElse("").lines()).flatMap(s -> Arrays.stream(s.split(","))).map(this::ext).filter(s -> !s.isBlank()).collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        Map<String, Long> contributors = all.stream().map(PullRequestEntity::getAuthor).filter(Objects::nonNull).collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        return Map.of("prsPerDay", prsPerDay, "scores", quality, "languages", languages, "topContributors", contributors,
                "filesAnalyzed", languages.values().stream().mapToLong(Long::longValue).sum(),
                "reviewAccuracy", sc.isEmpty() ? 0 : 92);
    }

    // ── Knowledge / Chat ──────────────────────────────────────────────────────

    @PostMapping("/knowledge/search")
    Object search(@RequestBody Map<String, Object> body) throws Exception {
        String q   = String.valueOf(body.getOrDefault("query", ""));
        int    topK = Integer.parseInt(String.valueOf(body.getOrDefault("topK", 8)));
        List<VectorSearchResult> results = q.isBlank() ? List.of() : qdrant.searchSimilar(orchestrator.embed(q), topK);
        return Map.of("query", q, "results", results);
    }

    @PostMapping("/chat")
    Object chat(@RequestBody Map<String, Object> body) throws Exception {
        String message = String.valueOf(body.getOrDefault("message", ""));
        List<String> ctx = message.isBlank() ? List.of()
                : qdrant.searchSimilar(orchestrator.embed(message), 8).stream().map(VectorSearchResult::text).toList();
        try {
            AiResponse r = orchestrator.completeWithFallback(
                    "You are MergeLens AI. Answer using the provided repository context.",
                    "Context:\n" + ctx + "\n\nQuestion:\n" + message
            );
            return Map.of("answer", r.content(), "context", ctx, "provider", r.providerName());
        } catch (AiUnavailableException e) {
            return Map.of("answer", "AI is temporarily unavailable: " + e.getMessage(), "context", ctx);
        }
    }

    // ── SSE ───────────────────────────────────────────────────────────────────

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    SseEmitter events() { return realtime.subscribe(); }

    // ── Status / Health ───────────────────────────────────────────────────────

    /**
     * Runtime health for all integrations.
     * NVIDIA and Groq report their actual configured/healthy state.
     */
    @GetMapping("/status")
    Object status() {
        boolean qdrantOk;
        try { qdrantOk = qdrant.collectionExists(); } catch (Exception e) { qdrantOk = false; }

        var nv = orchestrator.getNvidiaProvider();
        var gr = orchestrator.getGroqProvider();

        var nvStatus = nv.getStatus();
        var grStatus = gr.getStatus();

        String currentProvider  = nvStatus.healthy() ? "NVIDIA" : (grStatus.healthy() ? "Groq" : "none");
        String fallbackProvider = "Groq";

        return Map.of(
                "github",          !githubToken.isBlank(),
                "mysql",           true,
                "qdrant",          qdrantOk,
                "qdrantUrl",       qdrantUrl,
                "nvidia",          nvStatus,
                "groq",            grStatus,
                "currentProvider", currentProvider,
                "fallbackProvider",fallbackProvider,
                "fallbackEnabled", gr.isConfigured()
        );
    }

    /**
     * Detailed AI provider status and metrics.
     */
    @GetMapping("/ai/status")
    Object aiStatus() {
        var nv = orchestrator.getNvidiaProvider();
        var gr = orchestrator.getGroqProvider();

        var nvStatus = nv.getStatus();
        var grStatus = gr.getStatus();

        return Map.of(
                "currentProvider",      nvStatus.healthy() ? "NVIDIA" : (grStatus.healthy() ? "Groq" : "none"),
                "fallbackProvider",     "Groq",
                "fallbackEnabled",      gr.isConfigured(),
                "totalRequests",        orchestrator.getTotalRequests(),
                "fallbackCount",        orchestrator.getFallbackCount(),
                "averageLatencyMs",     orchestrator.getAverageLatencyMs(),
                "lastSuccessfulProvider", orchestrator.getLastProvider(),
                "providers", List.of(nvStatus, grStatus)
        );
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    private Map<String, Object> row(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(String.valueOf(kv[i]), kv[i + 1]);
        return m;
    }

    private int nz(Integer i) { return i == null ? 0 : i; }

    private String ext(String file) {
        int dot = file.lastIndexOf('.');
        return dot >= 0 && dot < file.length() - 1 ? file.substring(dot + 1).toLowerCase() : "other";
    }
}
