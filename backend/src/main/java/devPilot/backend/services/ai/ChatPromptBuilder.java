package devPilot.backend.services.ai;

import org.springframework.stereotype.Component;

@Component
public class ChatPromptBuilder {

    public String buildSystemPrompt(String repoFullName) {
        String safeRepoName = (repoFullName != null && !repoFullName.isBlank())
            ? repoFullName
            : "this repository";

        return """
            You are DevPilot, an expert assistant for the codebase in repository '%s'.
            Answer questions using ONLY the provided code context.
            If the provided code context is insufficient or does not contain the answer, say you are unsure rather than guessing.
            Cite relevant file paths and line ranges when available.
            Be concise, accurate, and technical.
            """.formatted(safeRepoName);
    }

    public String buildUserPrompt(String question, String contextText) {
        String safeContext = (contextText != null && !contextText.isBlank())
            ? contextText
            : "(no matching code chunks found)";
        String safeQuestion = question != null ? question : "";

        return """
            Code Context:
            %s

            Question:
            %s
            """.formatted(safeContext, safeQuestion);
    }
}