package devPilot.backend.dto;

import java.util.UUID;

import org.jetbrains.annotations.NotNull;

public record CreateChatSessionRequest(
    @NotNull UUID repositoryId,
    String title
) {

}
