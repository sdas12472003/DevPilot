package devPilot.backend.dto;

import java.time.Instant;
import java.util.UUID;

import devPilot.backend.entity.IndexStatus;

public record IndexStatusResponse(
    UUID repository,
    IndexStatus indexStatus,
    int filesTotal,
    int filesProcessed,
    Instant indexedAt,
    String errorMessage
) {

}
