package devPilot.backend.services.indexing;

import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;

@Component
public class CodeFileFilter {

    private static final Set<String> SKIP_DIR_PARTS = Set.of(
        "node_modules",
        ".git",
        "dist",
        "build",
        "target",
        ".next",
        "vendor",
        "__pycache__",
        ".idea",
        ".vscode",
        "coverage",
        "out"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "java", "kt", "kts", "scala",
        "ts", "tsx", "js", "jsx", "mjs", "cjs",
        "py", "go", "rs", "rb", "php",
        "c", "h", "cpp", "hpp", "cc", "cs",
        "swift", "sql", "sh", "bash", "ps1",
        "json", "yaml", "yml", "xml", "toml", "properties",
        "md", "mdx", "txt", "html", "css", "scss", "sass"
    );

    private static final Set<String> SKIP_FILE_NAMES = Set.of(
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "composer.lock",
        "cargo.lock",
        "poetry.lock",
        "gemfile.lock"
    );

    public boolean isEligible(String path, long sizeBytes, long maxFileBytes) {
        if (path == null || path.isBlank()) {
            return false;
        }
        if (maxFileBytes > 0 && sizeBytes > maxFileBytes) {
            return false;
        }

        String normalized = path.replace('\\', '/');
        String[] parts = normalized.split("/");

        for (int i = 0; i < parts.length - 1; i++) {
            String dirPart = parts[i].toLowerCase(Locale.ROOT);
            if (SKIP_DIR_PARTS.contains(dirPart)) {
                return false;
            }
        }

        String fileName = parts[parts.length - 1].toLowerCase(Locale.ROOT);
        if (SKIP_FILE_NAMES.contains(fileName)) {
            return false;
        }

        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return false;
        }

        String extension = fileName.substring(dotIndex + 1);
        return ALLOWED_EXTENSIONS.contains(extension);
    }

    public String detectLanguage(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "text";
        }

        String normalized = fileName.replace('\\', '/');
        int slashIndex = normalized.lastIndexOf('/');
        String baseName = slashIndex >= 0 ? normalized.substring(slashIndex + 1) : normalized;
        String lowerName = baseName.toLowerCase(Locale.ROOT);

        if ("dockerfile".equals(lowerName)) {
            return "dockerfile";
        }
        if ("makefile".equals(lowerName)) {
            return "makefile";
        }

        int dotIndex = lowerName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == lowerName.length() - 1) {
            return "text";
        }

        return lowerName.substring(dotIndex + 1);
    }
}