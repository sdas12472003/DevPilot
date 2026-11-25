package devPilot.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import devPilot.backend.dto.ChatMessageRequest;
import devPilot.backend.dto.ChatMessageResponse;
import devPilot.backend.dto.ChatSessionResponse;
import devPilot.backend.dto.CreateChatSessionRequest;
import devPilot.backend.security.CurrentUser;
import devPilot.backend.services.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final CurrentUser currentUser;
    private final ChatService chatService;

    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionResponse> createSession(
        @Valid @RequestBody CreateChatSessionRequest request
    ) {
        var user = currentUser.require();
        ChatSessionResponse created = chatService.createSession(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSessionResponse>> listSessions(
        @RequestParam UUID repositoryId
    ) {
        var user = currentUser.require();
        return ResponseEntity.ok(chatService.listSessions(user.getId(), repositoryId));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
        @PathVariable UUID sessionId
    ) {
        var user = currentUser.require();
        return ResponseEntity.ok(chatService.getMessages(user.getId(), sessionId));
    }

    @PostMapping(value = "/sessions/{sessionId}/messages/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMessage(
        @PathVariable UUID sessionId,
        @Valid @RequestBody ChatMessageRequest request
    ) {
        var user = currentUser.require();
        SseEmitter emitter = new SseEmitter(0L);
        chatService.streamMessage(user.getId(), sessionId, request.content(), emitter);
        return emitter;
    }
}