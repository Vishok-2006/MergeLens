package com.codelens.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {
    private static final String PROPERTY_SOURCE_NAME = "mergelens-dotenv";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path dotenv = findDotenv();
        if (dotenv == null) return;
        Map<String, Object> values = parse(dotenv);
        values.keySet().removeIf(environment::containsProperty);
        if (!values.isEmpty()) {
            environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, values));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }

    private Path findDotenv() {
        Path cwd = Path.of("").toAbsolutePath();
        Path current = cwd;
        for (int i = 0; i < 4 && current != null; i++) {
            Path candidate = current.resolve(".env");
            if (Files.isRegularFile(candidate)) return candidate;
            current = current.getParent();
        }
        return null;
    }

    private Map<String, Object> parse(Path path) {
        Map<String, Object> values = new LinkedHashMap<>();
        try {
            for (String line : Files.readAllLines(path)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) continue;
                int idx = trimmed.indexOf('=');
                String key = trimmed.substring(0, idx).trim();
                String value = trimmed.substring(idx + 1).trim();
                if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }
                values.put(key, value);
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read .env file " + path, ex);
        }
        return values;
    }
}
