package com.codelens.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GitHubClient {
    private final RestTemplate rest;

    @Value("${app.github.token:}")
    String token;

    HttpHeaders h() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        if (!token.isBlank()) headers.setBearerAuth(token);
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }

    public List<Map<String, Object>> changedFiles(String repo, int pr) {
        try {
            var response = rest.exchange("https://api.github.com/repos/" + repo + "/pulls/" + pr + "/files", HttpMethod.GET, new HttpEntity<>(h()), List.class);
            return Optional.ofNullable(response.getBody()).orElse(List.of());
        } catch (Exception e) {
            return List.of();
        }
    }

    public String diff(String diffUrl) {
        try {
            HttpHeaders headers = h();
            headers.setAccept(List.of(MediaType.valueOf("application/vnd.github.v3.diff")));
            return rest.exchange(diffUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class).getBody();
        } catch (Exception e) {
            return "";
        }
    }

    public String repositoryDocumentation(String repo) {
        for (String path : List.of("README.md", "README.MD", "docs/README.md")) {
            try {
                HttpHeaders headers = h();
                headers.setAccept(List.of(MediaType.valueOf("application/vnd.github.raw+json")));
                String body = rest.exchange("https://api.github.com/repos/" + repo + "/contents/" + path, HttpMethod.GET, new HttpEntity<>(headers), String.class).getBody();
                if (body != null && !body.isBlank()) return body;
            } catch (Exception ignored) {
            }
        }
        return "";
    }

    public void postComment(String repo, int pr, String commit, String path, int line, String body) {
        try {
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("body", body);
            request.put("commit_id", commit);
            request.put("path", path);
            request.put("line", line);
            request.put("side", "RIGHT");
            rest.exchange("https://api.github.com/repos/" + repo + "/pulls/" + pr + "/comments", HttpMethod.POST, new HttpEntity<>(request, h()), String.class);
        } catch (HttpStatusCodeException e) {
            System.err.println("GitHub comment failed " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
        } catch (Exception e) {
            System.err.println("GitHub comment failed: " + e.getMessage());
        }
    }
}
