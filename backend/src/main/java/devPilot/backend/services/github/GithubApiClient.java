package devPilot.backend.services.github;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GithubApiClient {

    private static final String API_BASE = "https://api.github.com";

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_MAP =
        new ParameterizedTypeReference<>() {};

    private static final ParameterizedTypeReference<Map<String, Object>> MAP =
        new ParameterizedTypeReference<>() {};

    private final RestClient.Builder restClientBuilder;

    private RestClient client(String accessToken) {
        return restClientBuilder
            .baseUrl(API_BASE)
            .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
            .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
            .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
            .defaultHeader("User-Agent", "DevPilot")
            .build();
    }

    public List<Map<String, Object>> listUserRepos(String accessToken) {
        List<Map<String, Object>> allRepos = new ArrayList<>();
        for (int page = 1; page <= 10; page++) {
            final int currentPage = page;
            List<Map<String, Object>> pageRepos = client(accessToken)
                .get()
                .uri(uriBuilder -> uriBuilder
                    .path("/user/repos")
                    .queryParam("affiliation", "owner,collaborator,organization_member")
                    .queryParam("sort", "updated")
                    .queryParam("per_page", 100)
                    .queryParam("page", currentPage)
                    .build())
                .retrieve()
                .body(LIST_MAP);

            if (pageRepos == null || pageRepos.isEmpty()) {
                break;
            }
            allRepos.addAll(pageRepos);
            if (pageRepos.size() < 100) {
                break;
            }
        }
        return allRepos;
    }

    public Map<String, Object> getRepoTree(String accessToken, String owner, String repo, String branch) {
        return client(accessToken)
            .get()
            .uri("/repos/{owner}/{repo}/git/trees/{branch}?recursive=1", owner, repo, branch)
            .retrieve()
            .body(MAP);
    }

    public String getFileContent(String accessToken, String owner, String repo, String path) {
        Map<String, Object> body = client(accessToken)
            .get()
            .uri("/repos/{owner}/{repo}/contents/{path}", owner, repo, path)
            .retrieve()
            .body(MAP);

        if (body == null || body.get("content") == null) {
            return null;
        }
        String raw = body.get("content").toString().replaceAll("\\s+", "");
        byte[] decoded = Base64.getDecoder().decode(raw);
        return new String(decoded, StandardCharsets.UTF_8);
    }
}