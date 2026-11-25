package devPilot.backend.services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import devPilot.backend.dto.ChatMessageResponse;
import devPilot.backend.dto.ChatSessionResponse;
import devPilot.backend.dto.CitationDto;
import devPilot.backend.dto.CreateChatSessionRequest;
import devPilot.backend.entity.ChatMessage;
import devPilot.backend.entity.ChatMessageRole;
import devPilot.backend.entity.ChatSession;
import devPilot.backend.entity.IndexStatus;
import devPilot.backend.entity.Repository;
import devPilot.backend.exceptions.BadRequestException;
import devPilot.backend.exceptions.NotFoundException;
import devPilot.backend.repository.ChatMessageRepository;
import devPilot.backend.repository.ChatSessionRepository;
import devPilot.backend.repository.RepositoryRepository;
import devPilot.backend.services.ai.ChatPromptBuilder;
import devPilot.backend.services.ai.ChatStreamHandler;
import devPilot.backend.services.ai.CodeContextRetriever;
import devPilot.backend.services.ai.RetrievedContext;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RepositoryRepository repositoryRepository;
    private final CodeContextRetriever codeContextRetriever;
    private final ChatPromptBuilder chatPromptBuilder;
    private final ChatStreamHandler chatStreamHandler;
    private final ObjectMapper objectMapper;

    @Transactional
    public ChatSessionResponse createSession(UUID userId, CreateChatSessionRequest request) {
        if (userId == null) {
            throw new BadRequestException("User id is required");
        }
        if (request == null || request.repositoryId() == null) {
            throw new BadRequestException("Repository id is required");
        }

        Repository repo = repositoryRepository.findByIdAndUserId(request.repositoryId(), userId)
            .orElseThrow(() -> new NotFoundException("Repository not found"));

        if (repo.getIndexStatus() != IndexStatus.READY) {
            throw new BadRequestException("Repository must be indexed before starting a chat session");
        }

        String title = (request.title() != null && !request.title().isBlank())
            ? request.title().trim()
            : "New Chat";
        if (title.length() > 200) {
            title = title.substring(0, 200);
        }

        ChatSession session = ChatSession.builder()
            .userId(userId)
            .repositoryId(repo.getId())
            .title(title)
            .build();

        ChatSession saved = chatSessionRepository.save(session);
        return toSessionResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(UUID userId, UUID repositoryId) {
        if (userId == null) {
            throw new BadRequestException("User id is required");
        }
        if (repositoryId == null) {
            throw new BadRequestException("Repository id is required");
        }

        repositoryRepository.findByIdAndUserId(repositoryId, userId)
            .orElseThrow(() -> new NotFoundException("Repository not found"));

        return chatSessionRepository
            .findByUserIdAndRepositoryIdOrderByCreatedAtDesc(userId, repositoryId)
            .stream()
            .map(this::toSessionResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(UUID userId, UUID sessionId) {
        if (userId == null) {
            throw new BadRequestException("User id is required");
        }
        if (sessionId == null) {
            throw new BadRequestException("Chat session id is required");
        }
        requireOwnedSession(userId, sessionId);
        return chatMessageRepository
            .findBySessionIdOrderByCreatedAtAsc(sessionId)
            .stream()
            .map(this::toMessageResponse)
            .toList();
    }

    @Transactional
    public void streamMessage(
        UUID userId,
        UUID sessionId,
        String question,
        SseEmitter emitter
    ) {
        if (userId == null) {
            throw new BadRequestException("User id is required");
        }
        if (sessionId == null) {
            throw new BadRequestException("Chat session id is required");
        }
        if (question == null || question.isBlank()) {
            throw new BadRequestException("Message content is required");
        }
        if (emitter == null) {
            throw new BadRequestException("SSE emitter is required");
        }

        ChatSession session = requireOwnedSession(userId, sessionId);
        Repository repo = repositoryRepository.findByIdAndUserId(session.getRepositoryId(), userId)
            .orElseThrow(() -> new NotFoundException("Repository not found"));

        if (repo.getIndexStatus() != IndexStatus.READY) {
            throw new BadRequestException("Repository is not ready for chat");
        }

        ChatMessage userMessage = ChatMessage.builder()
            .sessionId(session.getId())
            .role(ChatMessageRole.USER)
            .content(question.trim())
            .build();
        chatMessageRepository.save(userMessage);

        RetrievedContext retrievedContext = codeContextRetriever.retrieve(repo.getId(), question.trim());
        if (retrievedContext == null) {
            throw new BadRequestException("Unable to retrieve repository context");
        }
        String systemPrompt = chatPromptBuilder.buildSystemPrompt(repo.getFullName());
        String userPrompt = chatPromptBuilder.buildUserPrompt(question.trim(), retrievedContext.contextText());
        List<CitationDto> citations = retrievedContext.citations();

        chatStreamHandler.stream(session.getId(), emitter, systemPrompt, userPrompt, citations);
    }

    private ChatSession requireOwnedSession(UUID userId, UUID sessionId) {
        if (userId == null) {
            throw new BadRequestException("User id is required");
        }
        if (sessionId == null) {
            throw new BadRequestException("Chat session id is required");
        }
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new NotFoundException("Chat session not found"));
    }

    private ChatSessionResponse toSessionResponse(ChatSession session) {
        return new ChatSessionResponse(
            session.getId(),
            session.getRepositoryId(),
            session.getTitle(),
            session.getCreatedAt()
        );
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
            message.getId(),
            message.getRole(),
            message.getContent(),
            parseCitations(message.getCitations()),
            message.getCreatedAt()
        );
    }

    private List<CitationDto> parseCitations(String citationsJson) {
        if (citationsJson == null || citationsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(citationsJson, new TypeReference<List<CitationDto>>() {});
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }
}