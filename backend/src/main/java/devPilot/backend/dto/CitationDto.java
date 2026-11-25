package devPilot.backend.dto;

public record CitationDto(
    String filePath,
    Integer starLine,
    Integer endLine,
    String language
) {

}
