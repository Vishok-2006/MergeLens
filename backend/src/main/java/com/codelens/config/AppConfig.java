package com.codelens.config;
import org.springframework.boot.web.client.RestTemplateBuilder;import org.springframework.context.annotation.*;import org.springframework.scheduling.annotation.EnableAsync;import org.springframework.web.client.RestTemplate;import java.time.Duration;
@Configuration @EnableAsync public class AppConfig { @Bean RestTemplate restTemplate(RestTemplateBuilder b){return b.setConnectTimeout(Duration.ofSeconds(10)).setReadTimeout(Duration.ofSeconds(30)).build();}}
