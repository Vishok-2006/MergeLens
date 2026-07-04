package com.codelens.ai.providers;

import com.codelens.ai.dto.AiResponse;
import com.codelens.ai.dto.ProviderStatus;

import java.util.List;

/**
 * Contract for every AI provider (NVIDIA, Groq, OpenAI, Gemini, Claude, …).
 * Controllers and orchestrators depend only on this interface.
 */
public interface AIProvider {

    /** Human-readable provider name (e.g. "NVIDIA", "Groq"). */
    String providerName();

    /** The chat/completion model name currently in use. */
    String modelName();

    /** The embedding model name currently in use (empty string if unsupported). */
    String embeddingModel();

    /** Returns true if all required configuration (API key, base URL, model) is present. */
    boolean isConfigured();

    /**
     * Returns true if the provider is reachable and responding.
     */
    boolean isHealthy();

    /**
     * Returns detailed configuration, health, and status information.
     */
    ProviderStatus getStatus();

    /**
     * Submit a prompt and return the AI's completion text.
     *
     * @param systemPrompt  System instructions.
     * @param userPrompt    User message / code diff / context.
     * @return              AiResponse carrying content, provider, model, and latency.
     * @throws Exception    Any transport or API error.
     */
    AiResponse complete(String systemPrompt, String userPrompt) throws Exception;

    /**
     * Produce a vector embedding for the given text.
     *
     * @param input  Text to embed.
     * @return       Embedding vector as list of doubles.
     * @throws Exception  Any transport or API error.
     */
    List<Double> embed(String input) throws Exception;
}
