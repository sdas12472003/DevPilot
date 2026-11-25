package devPilot.backend.services;

import java.util.Map;
import java.util.UUID;

import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import devPilot.backend.entity.User;
import devPilot.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    public final UserRepository userRepository;
    public final TextEncryptor textEncryptor;

    @Transactional
    public User upsertFromGitHub(Map<String, Object> attributes, String accessToken, String scopes) {
        Long ghId = toLong(attributes.get("id"));
        String login = (String) attributes.get("login");
        String name = (String) attributes.get("name");
        String displayName = (name == null || name.isBlank()) ? login : name;
        String avatarUrl = (String) attributes.get("avatar_url");
        String encryptedToken = textEncryptor.encrypt(accessToken);

        User user = userRepository.findByGithubId(ghId).orElseGet(User::new);

        user.setGithubId(ghId);
        user.setGithubUsername(login);
        user.setDisplayName(displayName);
        user.setAvatarUrl(avatarUrl);
        user.setAccessToken(encryptedToken);
        user.setTokenScopes(scopes);

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User requiredById(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public String decryptAccessToken(User user) {
        return textEncryptor.decrypt(user.getAccessToken());
    }

    private static Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }
}