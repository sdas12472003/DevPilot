package devPilot.backend.services.ai;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter.Expression;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import devPilot.backend.dto.CitationDto;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CodeContextRetriever {

    private static final String NO_MATCHES = "(no matching code chunks found)";
    private static final int TOP_K = 5;

    private final VectorStore vectorStore;
    private final CitationMapper citationMapper;

    public RetrievedContext retrieve(UUID repoId, String question) {
        FilterExpressionBuilder builder = new FilterExpressionBuilder();
        Expression repoFilter = builder
            .eq(RagSettings.METADATA_REPO_ID, repoId.toString())
            .build();

        SearchRequest request = SearchRequest.builder()
            .query(question)
            .topK(TOP_K)
            .filterExpression(repoFilter)
            .build();

        List<Document> matches = vectorStore.similaritySearch(request);
        if (matches == null || matches.isEmpty()) {
            return new RetrievedContext(List.of(), NO_MATCHES);
        }

        String contextText = matches.stream()
            .map(doc -> {
                String filePath = String.valueOf(doc.getMetadata().getOrDefault("filePath", "unknown"));
                return "File: " + filePath + "\n" + doc.getText();
            })
            .collect(Collectors.joining("\n\n---\n\n"));

        List<CitationDto> citations = citationMapper.mapDocuments(matches);
        return new RetrievedContext(citations, contextText);
    }
}