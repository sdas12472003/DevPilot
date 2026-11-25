package devPilot.backend.services.ai;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;

import devPilot.backend.dto.CitationDto;

@Component
public class CitationMapper {

    public List<CitationDto> mapDocuments(List<Document> documents) {
        if (documents == null || documents.isEmpty()) {
            return List.of();
        }

        return documents.stream()
            .filter(Objects::nonNull)
            .map(this::toCitation)
            .toList();
    }

    public CitationDto toCitation(Document document) {
        Map<String, Object> metadata = document.getMetadata() != null
            ? document.getMetadata()
            : Map.of();

        String filePath = stringValue(metadata, "filePath", "file_path", "path", "unknown");
        String language = stringValue(metadata, "language", "lang", "text", "text");

        int startLine = intValue(metadata, "startLine", "start_line", 1);
        int endLine = intValue(metadata, "endLine", "end_line", startLine);

        return new CitationDto(filePath, startLine, endLine, language);
    }

    private static String stringValue(Map<String, Object> metadata, String primaryKey, String fallbackKey, String altKey, String defaultValue) {
        Object val = metadata.get(primaryKey);
        if (val == null && fallbackKey != null) {
            val = metadata.get(fallbackKey);
        }
        if (val == null && altKey != null) {
            val = metadata.get(altKey);
        }
        if (val == null) {
            return defaultValue;
        }
        String str = val.toString().trim();
        return str.isEmpty() ? defaultValue : str;
    }

    private static int intValue(Map<String, Object> metadata, String primaryKey, String fallbackKey, int defaultValue) {
        Object val = metadata.get(primaryKey);
        if (val == null && fallbackKey != null) {
            val = metadata.get(fallbackKey);
        }
        if (val instanceof Number number) {
            return number.intValue();
        }
        if (val != null) {
            try {
                return Integer.parseInt(val.toString().trim());
            } catch (NumberFormatException ignored) {
                return defaultValue;
            }
        }
        return defaultValue;
    }
}