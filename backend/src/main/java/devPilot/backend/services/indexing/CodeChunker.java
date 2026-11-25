package devPilot.backend.services.indexing;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import devPilot.backend.services.ai.RagSettings;

@Component
public class CodeChunker {

    private final CodeFileFilter codeFileFilter;
    private final TokenTextSplitter tokenTextSplitter;

    public CodeChunker(
        CodeFileFilter codeFileFilter,
        @Value("${app.indexing.chunk-size:800}") int chunkSize
    ) {
        this.codeFileFilter = codeFileFilter;
        int effectiveChunkSize = chunkSize > 0 ? chunkSize : 800;
        this.tokenTextSplitter = TokenTextSplitter.builder()
            .withChunkSize(effectiveChunkSize)
            .withMinChunkSizeChars(Math.max(40, effectiveChunkSize / 8))
            .withMinChunkLengthToEmbed(5)
            .withMaxNumChunks(10000)
            .withKeepSeparator(true)
            .build();
    }

    public List<Document> chunkFile(UUID repoId, String filePath, String content) {
        if (repoId == null || content == null || content.isBlank()) {
            return List.of();
        }

        String safePath = filePath != null ? filePath : "";
        String language = codeFileFilter.detectLanguage(safePath);
        Map<String, Object> sharedMetadata = baseMetadata(repoId, safePath, language);

        Document sourceDoc = new Document(content, sharedMetadata);
        List<Document> splitDocs = tokenTextSplitter.split(List.of(sourceDoc));

        return IntStream.range(0, splitDocs.size())
            .mapToObj(index -> {
                Document part = splitDocs.get(index);
                Map<String, Object> metadata = withChunkIndex(sharedMetadata, index);
                return new Document(part.getText(), metadata);
            })
            .toList();
    }

    private static Map<String, Object> baseMetadata(UUID repoId, String filePath, String language) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put(RagSettings.METADATA_REPO_ID, repoId.toString());
        metadata.put("filePath", filePath);
        metadata.put("language", language);
        return metadata;
    }

    private static Map<String, Object> withChunkIndex(Map<String, Object> sharedMetadata, int index) {
        Map<String, Object> metadata = new HashMap<>(sharedMetadata);
        metadata.put("chunkIndex", index);
        return metadata;
    }

}