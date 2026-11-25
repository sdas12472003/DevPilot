package devPilot.backend.services.ai;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import devPilot.backend.dto.CitationDto;
import devPilot.backend.entity.ChatMessage;
import devPilot.backend.entity.ChatMessageRole;
import devPilot.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStreamHandler {

    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    public void stream(
        UUID sessionId,
        SseEmitter emitter,
        String systemPrompt,
        String userPrompt,
        List<CitationDto> citations
    ) {
        ChatClient chatClient = ChatClient.builder(chatModel).build();
        StringBuilder fullResponse = new StringBuilder();
        AtomicReference<String> citationsJsonRef = new AtomicReference<>(serializeCitations(citations));

        try {
            chatClient.prompt()
                .system(systemPrompt)
                .user(userPrompt)
                .stream()
                .content()
                .subscribe(
                    token -> {
                        if (token != null) {
                            fullResponse.append(token);
                            sendEvent(emitter, "token", token);
                        }
                    },
                    error -> {
                        log.error("Error while streaming chat response for session {}", sessionId, error);
                        sendEvent(emitter, "error", error.getMessage() != null ? error.getMessage() : "Streaming error");
                        emitter.completeWithError(error);
                    },
                    () -> {
                        String finalContent = fullResponse.toString();
                        ChatMessage saved = ChatMessage.builder()
                            .sessionId(sessionId)
                            .role(ChatMessageRole.ASSISTANT)
                            .content(finalContent)
                            .citations(citationsJsonRef.get())
                            .build();

                        ChatMessage persisted = chatMessageRepository.save(saved);
                        sendEvent(emitter, "message", persisted.getId().toString());
                        sendEvent(emitter, "done", "[DONE]");
                        emitter.complete();
                    }
                );
        } catch (Exception ex) {
            log.error("Failed to start chat stream for session {}", sessionId, ex);
            sendEvent(emitter, "error", ex.getMessage() != null ? ex.getMessage() : "Failed to stream response");
            emitter.completeWithError(ex);
        }
    }

    private void sendEvent(SseEmitter emitter, String eventName, String data) {
        try {
            emitter.send(
                SseEmitter.event()
                    .name(eventName)
                    .data(data)
            );
        } catch (IOException ignored) {
            // Client disconnected or stream closed
        }
    }

    private String serializeCitations(List<CitationDto> citations) {
        if (citations == null || citations.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(citations);
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialize citations, falling back to empty JSON array", ex);
            return "[]";
        }
    }
}