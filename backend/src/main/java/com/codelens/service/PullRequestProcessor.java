package com.codelens.service;

import com.codelens.ai.service.AIOrchestratorService;
import com.codelens.config.RagProperties;
import com.codelens.entity.PullRequestEntity;
import com.codelens.entity.ReviewCommentEntity;
import com.codelens.repo.PullRequestRepo;
import com.codelens.repo.ReviewCommentRepo;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Asynchronous pipeline: GitHub PR → embed → Qdrant store → retrieve context → AI review.
 *
 * <p>All AI calls (embed + review) route through {@link AIOrchestratorService}.
 */
@Service
@RequiredArgsConstructor
public class PullRequestProcessor {

    private static final Logger log = LoggerFactory.getLogger(PullRequestProcessor.class);

    private final PullRequestRepo prs;
    private final ReviewCommentRepo comments;
    private final GitHubClient gitHub;
    private final QdrantService qdrant;
    private final AIOrchestratorService orchestrator;   // ← orchestrator, not NvidiaNimProvider
    private final AiReviewService ai;
    private final RagProperties ragProperties;
    private final RealtimeEventService realtime;

    @Async
    public void process(Long id, String headSha) {
        PullRequestEntity pr = prs.findById(id).orElseThrow();
        try {
            pr.setStatus("PROCESSING");
            prs.save(pr);
            realtime.publish("pr.processing", Map.of("pullRequestId", pr.getId(), "stage", "Processing", "title", pr.getTitle()));

            String repo = pr.getRepository().getFullName();
            String diff = gitHub.diff(pr.getDiffUrl());
            List<Map<String, Object>> files = gitHub.changedFiles(repo, pr.getNumber());
            pr.setFilesChanged(files.stream().map(f -> String.valueOf(f.get("filename"))).collect(Collectors.joining(",")));
            prs.save(pr);

            realtime.publish("pr.embedding", Map.of("pullRequestId", pr.getId(), "stage", "Embedding", "title", pr.getTitle()));
            qdrant.deleteByPullRequest(pr.getId());
            String documentation = gitHub.repositoryDocumentation(repo);
            storePullRequestVectors(pr, headSha, diff, files, documentation);

            realtime.publish("pr.retrieving", Map.of("pullRequestId", pr.getId(), "stage", "Retrieving Context", "title", pr.getTitle()));
            String query = "Review pull request: " + Objects.toString(pr.getTitle(), "") + "\n"
                    + Objects.toString(pr.getSummary(), "") + "\nChanged files: " + Objects.toString(pr.getFilesChanged(), "")
                    + "\nDiff:\n" + diff;

            List<Double> queryEmbedding = orchestrator.embed(query);
            List<String> context = qdrant.searchSimilar(queryEmbedding, ragProperties.topKResults())
                    .stream()
                    .map(VectorSearchResult::text)
                    .filter(s -> !s.isBlank())
                    .toList();

            realtime.publish("pr.generating", Map.of("pullRequestId", pr.getId(), "stage", "Generating Review", "title", pr.getTitle()));
            ai.review(pr, diff, context);
            storeReviewComments(pr, headSha);
            postReviewComments(repo, pr, headSha);
            pr.setStatus("COMPLETED");
            realtime.publish("pr.completed", Map.of("pullRequestId", pr.getId(), "stage", "Completed", "title", pr.getTitle()));

        } catch (Exception e) {
            log.error("[Processor] Pull request processing failed | id={} reason={}", id, e.getMessage(), e);
            pr.setStatus("FAILED: " + e.getMessage());
            realtime.publish("pr.failed", Map.of("pullRequestId", pr.getId(), "stage", "Failed", "error", e.getMessage()));
        } finally {
            pr.setUpdatedAt(Instant.now());
            prs.save(pr);
        }
    }

    // ── Vector storage ────────────────────────────────────────────────────────

    private void storePullRequestVectors(PullRequestEntity pr, String headSha,
                                         String diff, List<Map<String, Object>> files,
                                         String documentation) throws Exception {
        List<SourceChunk> chunks = new ArrayList<>();
        addIfPresent(chunks, "PR Title",       pr.getTitle(),       "PR_TITLE",       null, 0);
        addIfPresent(chunks, "PR Description", pr.getSummary(),     "PR_DESCRIPTION", null, 0);
        if (pr.getFilesChanged() != null && !pr.getFilesChanged().isBlank()) {
            addIfPresent(chunks, "Changed Files", pr.getFilesChanged(), "CHANGED_FILES", null, 0);
        }
        for (String docChunk : qdrant.chunk(documentation)) {
            chunks.add(new SourceChunk(docChunk, "REPOSITORY_DOCUMENTATION", null, chunks.size()));
        }
        for (Map<String, Object> file : files) {
            String filename = String.valueOf(file.getOrDefault("filename", ""));
            addIfPresent(chunks, "Changed File", filename, "CHANGED_FILE", languageFromFile(filename), chunks.size());
        }
        List<String> diffChunks = qdrant.chunk(diff);
        for (int i = 0; i < diffChunks.size(); i++) {
            chunks.add(new SourceChunk(diffChunks.get(i), "COMMIT_MESSAGES", null, i));
            chunks.add(new SourceChunk(diffChunks.get(i), "CHANGED_FILES",   null, i));
        }

        for (int i = 0; i < chunks.size(); i++) {
            SourceChunk chunk   = chunks.get(i);
            List<Double> vector = orchestrator.embed(chunk.text());  // ← via orchestrator
            VectorPayload payload = new VectorPayload(
                    pr.getRepository().getFullName(),
                    pr.getRepository().getId(),
                    pr.getId(),
                    headSha,
                    chunk.sourceType().equals("CHANGED_FILE") ? chunk.text() : null,
                    chunk.language(),
                    pr.getAuthor(),
                    chunk.chunkIndex(),
                    Instant.now(),
                    chunk.sourceType(),
                    chunk.text()
            );
            qdrant.upsertEmbedding(pointId(pr, chunk.sourceType(), i), vector, payload);
        }
        log.info("[Processor] Stored {} Qdrant vectors for PR id={}", chunks.size(), pr.getId());
    }

    private void storeReviewComments(PullRequestEntity pr, String headSha) throws Exception {
        List<ReviewCommentEntity> reviewComments = comments.findByPullRequestId(pr.getId());
        for (int i = 0; i < reviewComments.size(); i++) {
            ReviewCommentEntity comment = reviewComments.get(i);
            String text = comment.getMessage();
            if (text == null || text.isBlank()) continue;
            VectorPayload payload = new VectorPayload(
                    pr.getRepository().getFullName(),
                    pr.getRepository().getId(),
                    pr.getId(),
                    headSha,
                    comment.getFilePath(),
                    languageFromFile(comment.getFilePath()),
                    pr.getAuthor(),
                    i,
                    Instant.now(),
                    "REVIEW_COMMENTS",
                    text
            );
            qdrant.upsertEmbedding(pointId(pr, "REVIEW_COMMENTS", i), orchestrator.embed(text), payload);
        }
    }

    private void postReviewComments(String repo, PullRequestEntity pr, String headSha) {
        for (ReviewCommentEntity c : comments.findByPullRequestId(pr.getId())) {
            try {
                if (headSha != null && !headSha.isBlank()) {
                    gitHub.postComment(repo, pr.getNumber(), headSha, c.getFilePath(),
                            Math.max(1, c.getLineNumber() == null ? 1 : c.getLineNumber()),
                            "AI Review (" + c.getSeverity() + "): " + c.getMessage());
                }
                c.setPostStatus("POSTED");
            } catch (Exception ex) {
                c.setPostStatus("FAILED");
            }
            comments.save(c);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void addIfPresent(List<SourceChunk> chunks, String label, String text,
                              String sourceType, String language, int chunkIndex) {
        if (text != null && !text.isBlank())
            chunks.add(new SourceChunk(label + ":\n" + text, sourceType, language, chunkIndex));
    }

    private String pointId(PullRequestEntity pr, String sourceType, int index) {
        return pr.getRepository().getId() + "-" + pr.getId() + "-" + sourceType + "-" + index;
    }

    private String languageFromFile(String fileName) {
        if (fileName == null) return null;
        int dot = fileName.lastIndexOf('.');
        return dot >= 0 && dot < fileName.length() - 1 ? fileName.substring(dot + 1) : null;
    }

    private record SourceChunk(String text, String sourceType, String language, int chunkIndex) {}
}
