package devPilot.backend.services.indexing;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import devPilot.backend.entity.IndexStatus;
import devPilot.backend.entity.Repository;
import devPilot.backend.exceptions.NotFoundException;
import devPilot.backend.repository.RepositoryRepository;
import devPilot.backend.services.UserService;
import devPilot.backend.services.ai.RagSettings;
import devPilot.backend.services.github.GitHubRateLimiter;
import devPilot.backend.services.github.GithubApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndexingService {

    private static final int VECTOR_BATCH_SIZE = 32;
    private static final int PROGRESS_EVERY_N_FILES = 5;

    private final RepositoryRepository repositoryRepository;
    private final UserService userService;
    private final GithubApiClient githubApiClient;
    private final CodeFileFilter fileFilter;
    private final CodeChunker codeChunker;
    private final GitHubRateLimiter rateLimiter;
    private final VectorStore vectorStore;

    @Value("${app.indexing.max-file-bytes:102400}")
    private long maxFileBytes;

    public Repository startIndexing(UUID repoId, UUID userId) {
        Repository repo = repositoryRepository.findByIdAndUserId(repoId, userId)
            .orElseThrow(() -> new NotFoundException("Repository not found"));

        if (repo.getIndexStatus() == IndexStatus.INDEXING) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Repository is already being indexed"
            );
        }

        repo.setIndexStatus(IndexStatus.INDEXING);
        repo.setFilesProcessed(0);
        repo.setFilesTotal(0);
        repo.setChunkCount(0);
        repo.setErrorMessage(null);
        repo.setUpdatedAt(Instant.now());

        return repositoryRepository.save(repo);
    }

    @Async("indexingExecutor")
    public void indexAsync(UUID repoId, UUID userId) {
        try {
            doIndex(repoId, userId);
        } catch (Exception ex) {
            log.error("Indexing failed for repo {}", repoId, ex);
            markFailed(repoId, ex.getMessage());
        }
    }

    private void doIndex(UUID repoId, UUID userId) {
        Repository repo = repositoryRepository.findByIdAndUserId(repoId, userId)
            .orElseThrow(() -> new NotFoundException("Repository not found"));

        var user = userService.requiredById(userId);
        String token = userService.decryptAccessToken(user);

        deleteExistingVectors(repoId);

        String branch = (repo.getDefaultBranch() != null && !repo.getDefaultBranch().isBlank())
            ? repo.getDefaultBranch()
            : "main";

        Map<String, Object> treeResponse = githubApiClient.getRepoTree(
            token,
            repo.getOwner(),
            repo.getName(),
            branch
        );

        List<Map<String, Object>> indexableFiles = listIndexableFiles(treeResponse);
        int totalFiles = indexableFiles.size();
        int filesProcessed = 0;
        int totalChunks = 0;

        updateProgress(repoId, totalFiles, filesProcessed, totalChunks, IndexStatus.INDEXING, null);

        List<Document> batch = new ArrayList<>();

        for (Map<String, Object> fileEntry : indexableFiles) {
            String path = String.valueOf(fileEntry.get("path"));
            try {
                rateLimiter.pause();
                String decodedContent = githubApiClient.getFileContent(
                    token,
                    repo.getOwner(),
                    repo.getName(),
                    path
                );
                if (!decodedContent.isBlank()) {
                    List<Document> chunks = codeChunker.chunkFile(repoId, path, decodedContent);
                    batch.addAll(chunks);

                    if (batch.size() >= VECTOR_BATCH_SIZE) {
                        vectorStore.add(batch);
                        totalChunks += batch.size();
                        batch.clear();
                    }
                }
            } catch (Exception fileEx) {
                log.warn("Skipping file {} in repo {} due to error: {}", path, repoId, fileEx.getMessage());
            }

            filesProcessed++;
            if (filesProcessed % PROGRESS_EVERY_N_FILES == 0 || filesProcessed == totalFiles) {
                updateProgress(
                    repoId,
                    totalFiles,
                    filesProcessed,
                    totalChunks + batch.size(),
                    IndexStatus.INDEXING,
                    null
                );
            }
        }

        if (!batch.isEmpty()) {
            vectorStore.add(batch);
            totalChunks += batch.size();
            batch.clear();
        }

        markReady(repoId, totalFiles, filesProcessed, totalChunks);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> listIndexableFiles(Map<String, Object> treeResponse) {
        if (treeResponse == null || !(treeResponse.get("tree") instanceof List<?> treeItems)) {
            return List.of();
        }

        List<Map<String, Object>> eligible = new ArrayList<>();
        for (Object item : treeItems) {
            if (!(item instanceof Map<?, ?> rawMap)) {
                continue;
            }
            Map<String, Object> entry = (Map<String, Object>) rawMap;
            String type = String.valueOf(entry.get("type"));
            if (!"blob".equals(type)) {
                continue;
            }

            String path = entry.get("path") != null ? String.valueOf(entry.get("path")) : "";
            long size = entry.get("size") instanceof Number num ? num.longValue() : 0L;

            if (fileFilter.isEligible(path, size, maxFileBytes)) {
                eligible.add(entry);
            }
        }
        return eligible;
    }

    private void deleteExistingVectors(UUID repoId) {
        FilterExpressionBuilder builder = new FilterExpressionBuilder();
        var filterExpression = builder.eq(RagSettings.METADATA_REPO_ID, repoId.toString()).build();
        vectorStore.delete(filterExpression);
    }

    @Transactional
    protected void updateProgress(
        UUID repoId,
        int filesTotal,
        int filesProcessed,
        int chunkCount,
        IndexStatus status,
        String errorMessage
    ) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setFilesTotal(filesTotal);
            repo.setFilesProcessed(filesProcessed);
            repo.setChunkCount(chunkCount);
            repo.setIndexStatus(status);
            repo.setErrorMessage(errorMessage);
            repo.setUpdatedAt(Instant.now());
            repositoryRepository.save(repo);
        });
    }

    @Transactional
    protected void markReady(UUID repoId, int filesTotal, int filesProcessed, int chunkCount) {
        Instant now = Instant.now();
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setFilesTotal(filesTotal);
            repo.setFilesProcessed(filesProcessed);
            repo.setChunkCount(chunkCount);
            repo.setIndexStatus(IndexStatus.READY);
            repo.setErrorMessage(null);
            repo.setIndexedAt(now);
            repo.setUpdatedAt(now);
            repositoryRepository.save(repo);
        });
        log.info("Indexed repo {} ({} files, {} chunks)", repoId, filesProcessed, chunkCount);
    }

    @Transactional
    protected void markFailed(UUID repoId, String errorMessage) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setIndexStatus(IndexStatus.FAILED);
            repo.setErrorMessage(errorMessage != null ? errorMessage : "Indexing failed");
            repo.setUpdatedAt(Instant.now());
            repositoryRepository.save(repo);
        });
    }

}