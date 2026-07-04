package com.codelens.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class RealtimeEventService {
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));
        send(emitter, "connected", Map.of("type", "connected", "at", Instant.now().toString()));
        return emitter;
    }

    public void publish(String type, Object payload) {
        Map<String, Object> event = Map.of("type", type, "payload", payload, "at", Instant.now().toString());
        for (SseEmitter emitter : emitters) send(emitter, type, event);
    }

    private void send(SseEmitter emitter, String name, Object data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
        } catch (IOException | IllegalStateException e) {
            emitters.remove(emitter);
        }
    }
}
