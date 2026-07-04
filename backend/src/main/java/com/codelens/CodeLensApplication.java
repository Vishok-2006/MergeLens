package com.codelens;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Entry point for the CodeLens backend application.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class CodeLensApplication {
    public static void main(String[] args) {
        SpringApplication.run(CodeLensApplication.class, args);
    }
}
