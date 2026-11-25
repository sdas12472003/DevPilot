package devPilot.backend.services;

import java.util.ArrayList;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import devPilot.backend.dto.IndexStatusResponse;
import devPilot.backend.dto.RepositoryResponse;
import devPilot.backend.entity.Repository;
import devPilot.backend.entity.User;
import devPilot.backend.repository.RepositoryRepository;
import devPilot.backend.services.github.GithubApiClient;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor 
public class RepoService {
    private final RepositoryRepository repositoryRepository;
    private final UserService userService;
    private final GithubApiClient githubApiClient;

    @Transactional
    public List<RepositoryResponse> syncAndListRepos(UUID userId) {
        User user = userService.requiredById(userId);
        String token = userService.decryptAccessToken(user);
        List<Map<String, Object>> remoteRepos = githubApiClient.listUserRepos(token);

        List<Repository> saved = new ArrayList<>();
        if (remoteRepos != null) {
            for (Map<String, Object> remote : remoteRepos) {
                if (remote == null) {
                    continue;
                }

                Long githubRepoId = toLong(remote.get("id"));
                if (githubRepoId == null) {
                    continue;
                }

                Repository repo = repositoryRepository
                    .findByUserIdAndGithubRepoId(userId, githubRepoId)
                    .orElseGet(Repository::new);

                String fullName = remote.get("full_name") != null
                    ? remote.get("full_name").toString()
                    : "";
                String[] parts = fullName.split("/", 2);
                String name = remote.get("name") != null
                    ? remote.get("name").toString()
                    : (parts.length > 1 ? parts[1] : fullName);

                String owner = null;
                Object ownerObj = remote.get("owner");
                if (ownerObj instanceof Map<?, ?> ownerMap && ownerMap.get("login") != null) {
                    owner = ownerMap.get("login").toString();
                }
                if ((owner == null || owner.isBlank()) && parts.length > 0 && !parts[0].isBlank()) {
                    owner = parts[0];
                }
                if (owner == null || owner.isBlank()) {
                    owner = user.getGithubUsername();
                }

                repo.setUserId(userId);
                repo.setGithubRepoId(githubRepoId);
                repo.setOwner(owner);
                repo.setName(name);
                repo.setFullName(fullName);
                repo.setPrivate(Boolean.TRUE.equals(remote.get("private")));
                repo.setDefaultBranch(remote.get("default_branch") != null
                    ? remote.get("default_branch").toString()
                    : "main");
                repo.setLanguage(remote.get("language") != null
                    ? remote.get("language").toString()
                    : null);
                repo.setHtmlUrl(remote.get("html_url") != null
                    ? remote.get("html_url").toString()
                    : null);
                repo.setDescription(remote.get("description") != null
                    ? remote.get("description").toString()
                    : null);
                repo.setUpdatedAt(Instant.now());

                saved.add(repositoryRepository.save(repo));
            }
        }

        return saved.stream()
            .sorted(Comparator.comparing(
                (Repository repo) -> repo.getFullName(),
                String.CASE_INSENSITIVE_ORDER
            ))
            .map(this::toResponse)
            .toList();
    }
    @Transactional(readOnly = true)
    public IndexStatusResponse status(UUID repoId,UUID userId)
    {
        Repository repo=requireOwned(repoId, userId);
        return new IndexStatusResponse(
            repo.getId(),
            repo.getIndexStatus(),
            repo.getFilesTotal(),
            repo.getFilesProcessed(),
            repo.getIndexedAt(),
            repo.getErrorMessage()
        );

    }
    @Transactional(readOnly = true)
    public Repository requireOwned(UUID repoId, UUID userId)
    {
        return repositoryRepository.findByIdAndUserId(repoId, userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Repository not found"));
    }
    @Transactional(readOnly=true)
    public List<RepositoryResponse> listStored(UUID userId)
    {
        return repositoryRepository.findByUserIdOrderByFullNameAsc(userId).stream()
        .map(this:: toResponse)
        .toList();
    }

    public RepositoryResponse toResponse(Repository repo) {
        return new RepositoryResponse(
            repo.getId(),
            repo.getGithubRepoId(),
            repo.getOwner(),
            repo.getName(),
            repo.getFullName(),
            repo.isPrivate(),
            repo.getDefaultBranch(),
            repo.getLanguage(),
            repo.getHtmlUrl(),
            repo.getDescription(),
            repo.getIndexStatus(),
            repo.getIndexedAt(),
            repo.getChunkCount(),
            repo.getFilesTotal(),
            repo.getFilesProcessed(),
            repo.getErrorMessage()
        );
    }

    private static Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        String text = value.toString().trim();
        if (text.isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(text);
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
