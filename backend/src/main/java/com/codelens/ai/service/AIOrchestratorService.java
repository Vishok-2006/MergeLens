package com.codelens.ai.service;

import com.codelens.ai.dto.AiResponse;
import com.codelens.ai.providers.AIProvider;
import com.codelens.ai.providers.GroqProvider;
import com.codelens.ai.providers.NvidiaProvider;
import com.codelens.config.AiProperties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Central AI orchestrator.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Select the active provider (NVIDIA primary, Groq fallback)</li>
 *   <li>Automatic fallback on any NVIDIA failure</li>
 *   <li>Embedding delegation (always NVIDIA; no Groq embedding endpoint)</li>
 *   <li>Metrics: request count, fallback count, last provider used</li>
 *   <li>Meaningful error messages — never raw stack traces</li>
 * </ul>
 */
@Service
public class AIOrchestratorService {

    private static final Logger log = LoggerFactory.getLogger(AIOrchestratorService.class);

    private static final String SYSTEM_REVIEW_PROMPT =
            "You are a senior code reviewer. Analyse the pull request diff and return STRICT JSON only:\n"
            + "{\"comments\":[{\"file\":\"path\",\"line\":1,\"severity\":\"low|medium|high\",\"message\":\"...\"}],"
            + "\"scores\":{\"security\":0,\"quality\":0,\"complexity\":0}}";

    private final NvidiaProvider nvidia;
    private final GroqProvider groq;
    private final AiProperties aiProperties;

    // ── Metrics ──────────────────────────────────────────────────────────────
    private final AtomicLong totalRequests   = new AtomicLong();
    private final AtomicLong fallbackCount   = new AtomicLong();
    private final AtomicLong totalLatencyMs  = new AtomicLong();
    private final AtomicReference<String> lastProvider = new AtomicReference<>("none");

    public AIOrchestratorService(NvidiaProvider nvidia, GroqProvider groq, AiProperties aiProperties) {
        this.nvidia = nvidia;
        this.groq   = groq;
        this.aiProperties = aiProperties;
    }

    // ── Startup logging ───────────────────────────────────────────────────────

    @PostConstruct
    void logStartupStatus() {
        log.info("──────────────────────────────────────────");
        log.info("  AI Configuration");
        log.info("──────────────────────────────────────────");
        log.info("  NVIDIA Key      : {}", nvidia.isConfigured() ? "Loaded" : "MISSING");
        log.info("  Groq Key        : {}", groq.isConfigured()   ? "Loaded" : "MISSING");
        log.info("  NVIDIA Model    : {}", nvidia.isConfigured() ? nvidia.modelName() : "Not configured");
        log.info("  Groq Model      : {}", groq.isConfigured()   ? groq.modelName()   : "Not configured");
        log.info("  Primary AI      : NVIDIA");
        log.info("  Fallback AI     : Groq");
        log.info("──────────────────────────────────────────");

        if (!nvidia.isConfigured() && !groq.isConfigured()) {
            log.error("CRITICAL: No AI provider is configured. AI review will not work.");
        } else if (!nvidia.isConfigured()) {
            log.warn("NVIDIA is not configured — Groq will be used for all AI requests.");
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Run a PR code review using the best available provider.
     * Falls back to Groq automatically on any NVIDIA failure.
     */
    public AiResponse review(String diff, List<String> context) throws AiUnavailableException {
        String contextBlock = context.isEmpty() ? "" : "\n\nRelevant context from codebase:\n" + String.join("\n---\n", context);
        String userPrompt = "Review this pull request diff:" + contextBlock + "\n\nDiff:\n" + diff;
        return completeWithFallback(SYSTEM_REVIEW_PROMPT, userPrompt);
    }

    /**
     * Generic completion with automatic NVIDIA → Groq fallback.
     */
    public AiResponse completeWithFallback(String systemPrompt, String userPrompt) throws AiUnavailableException {
        totalRequests.incrementAndGet();
        long start = System.currentTimeMillis();

        // ── Try NVIDIA first ──────────────────────────────────────────────────
        if (nvidia.isConfigured()) {
            try {
                log.info("[AI] Request started | provider=NVIDIA model={}", nvidia.modelName());
                AiResponse response = callWithTimeout(nvidia, systemPrompt, userPrompt);
                totalLatencyMs.addAndGet(response.latencyMs());
                lastProvider.set("NVIDIA");
                log.info("[AI] Request completed | provider=NVIDIA model={} latency={}ms tokens={}/{}",
                        response.modelName(), response.latencyMs(),
                        response.promptTokens(), response.completionTokens());
                return response;
            } catch (Exception ex) {
                log.warn("[AI] NVIDIA request failed | reason={} | switching to Groq", ex.getMessage());
            }
        } else {
            log.warn("[AI] NVIDIA not configured — skipping to fallback");
        }

        // ── Fallback: Groq ────────────────────────────────────────────────────
        if (groq.isConfigured()) {
            fallbackCount.incrementAndGet();
            try {
                log.info("[AI] Fallback activated | provider=Groq model={}", groq.modelName());
                AiResponse response = callWithTimeout(groq, systemPrompt, userPrompt);
                totalLatencyMs.addAndGet(response.latencyMs());
                lastProvider.set("Groq");
                log.info("[AI] Fallback request completed | provider=Groq model={} latency={}ms",
                        response.modelName(), response.latencyMs());
                return response.asFallback();
            } catch (Exception ex) {
                log.error("[AI] Groq fallback also failed | reason={}", ex.getMessage());
                long elapsed = System.currentTimeMillis() - start;
                totalLatencyMs.addAndGet(elapsed);
                throw new AiUnavailableException("Both NVIDIA and Groq failed. Last error: " + ex.getMessage());
            }
        }

        throw new AiUnavailableException("No configured AI provider available. Configure NVIDIA_API_KEY or GROQ_API_KEY.");
    }

    /**
     * Produce a vector embedding.
     * Always uses NVIDIA (only provider with an embedding endpoint).
     */
    public List<Double> embed(String input) throws Exception {
        if (!nvidia.isConfigured()) {
            throw new AiUnavailableException("NVIDIA is required for embeddings but is not configured.");
        }
        try {
            return nvidia.embed(input);
        } catch (Exception ex) {
            log.error("[AI] Embedding failed | provider=NVIDIA reason={}", ex.getMessage());
            throw new AiUnavailableException("Embedding failed: " + ex.getMessage());
        }
    }

    // ── Metrics getters ───────────────────────────────────────────────────────

    public long getTotalRequests()  { return totalRequests.get(); }
    public long getFallbackCount()  { return fallbackCount.get(); }
    public String getLastProvider() { return lastProvider.get(); }

    public long getAverageLatencyMs() {
        long req = totalRequests.get();
        return req == 0 ? 0 : totalLatencyMs.get() / req;
    }

    public NvidiaProvider getNvidiaProvider() { return nvidia; }
    public GroqProvider   getGroqProvider()   { return groq; }

    // ── Private helpers ───────────────────────────────────────────────────────

    private AiResponse callWithTimeout(AIProvider provider, String system, String user) throws Exception {
        long timeoutMs = aiProperties.timeoutMs() > 0 ? aiProperties.timeoutMs() : 30_000L;
        java.util.concurrent.ExecutorService exec = java.util.concurrent.Executors.newSingleThreadExecutor();
        try {
            return exec.submit(() -> provider.complete(system, user))
                       .get(timeoutMs, java.util.concurrent.TimeUnit.MILLISECONDS);
        } finally {
            exec.shutdownNow();
        }
    }
}
