package devPilot.backend.dto;



public record UserResponse(
    Long id,
    String githubId,
    String githubUsername,
    String displayName,
    String avatarUrl

) {

    public UserResponse(String string, Long githubId2, String githubUsername2, String displayName2, String avatarUrl2) {
        this(githubId2, string, githubUsername2, displayName2, avatarUrl2);
    }



}
