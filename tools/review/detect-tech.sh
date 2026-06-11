#!/bin/bash
# Detect technologies used in a repository
# Usage: ./detect-tech.sh <repo-path>
#
# Outputs JSON with detected technologies and relevant best practices paths
# Example: {"technologies":["springboot","k6"],"best_practices":["docs/best-practices/k6/BEST_PRACTICES.md"]}

set -e

REPO_PATH="${1:-}"

if [[ -z "$REPO_PATH" ]] || [[ ! -d "$REPO_PATH" ]]; then
    echo '{"technologies":[],"best_practices":[]}'
    exit 0
fi

technologies=()
best_practices=()

# Helper to check if file contains pattern (checks root and common subdirs)
file_contains() {
    local file="$1"
    local pattern="$2"

    # Check root
    [[ -f "$REPO_PATH/$file" ]] && grep -qE "$pattern" "$REPO_PATH/$file" 2>/dev/null && return 0

    # Check common subdirectories
    for subdir in service app src; do
        [[ -f "$REPO_PATH/$subdir/$file" ]] && grep -qE "$pattern" "$REPO_PATH/$subdir/$file" 2>/dev/null && return 0
    done

    return 1
}

# Helper to check if file exists at root or common subdirs
file_exists() {
    local file="$1"
    [[ -f "$REPO_PATH/$file" ]] && return 0
    for subdir in service app src; do
        [[ -f "$REPO_PATH/$subdir/$file" ]] && return 0
    done
    return 1
}

# Helper to check if any file matches glob and contains pattern
any_file_contains() {
    local glob="$1"
    local pattern="$2"
    grep -rqE --include="$glob" "$pattern" "$REPO_PATH" 2>/dev/null
}

# ============================================
# K6 Detection
# ============================================
detect_k6() {
    # Check package.json for k6
    if file_contains "package.json" '"k6"'; then
        return 0
    fi

    # Check for k6 imports in JS files
    if any_file_contains "*.js" "from ['\"]k6[/'\"]|require\(['\"]k6"; then
        return 0
    fi

    # Check for k6 config or typical k6 directory structure
    if [[ -d "$REPO_PATH/k6" ]] || file_exists "k6.config.js"; then
        return 0
    fi

    # Check for typical k6 test patterns
    if any_file_contains "*.js" "export (default )?function|import \{ (check|sleep|group)"; then
        # Also verify it's k6-style (has http or k6 imports)
        if any_file_contains "*.js" "from ['\"]k6/http['\"]"; then
            return 0
        fi
    fi

    return 1
}

# ============================================
# Playwright Detection
# ============================================
detect_playwright() {
    # Check package.json for playwright
    if file_contains "package.json" '"@playwright/test"|"playwright"'; then
        return 0
    fi

    # Check for playwright config
    if file_exists "playwright.config.ts" || file_exists "playwright.config.js"; then
        return 0
    fi

    # Check for playwright imports in test files
    if any_file_contains "*.ts" "from ['\"]@playwright/test['\"]"; then
        return 0
    fi

    return 1
}

# ============================================
# Spring Boot Detection
# ============================================
detect_springboot() {
    # Check pom.xml for spring-boot
    if file_contains "pom.xml" "spring-boot|org\.springframework\.boot"; then
        return 0
    fi

    # Check build.gradle for spring-boot
    if file_contains "build.gradle" "org\.springframework\.boot|spring-boot"; then
        return 0
    fi

    # Check for Spring Boot annotations in Java files (sample a few)
    if any_file_contains "*.java" "@SpringBootApplication|@RestController|@Service|@Repository"; then
        return 0
    fi

    return 1
}

# ============================================
# Hapi Detection
# ============================================
detect_hapi() {
    # Check package.json for hapi
    if file_contains "package.json" '"@hapi/hapi"|"hapi"'; then
        return 0
    fi

    # Check for hapi imports/requires
    if any_file_contains "*.js" "require\(['\"]@hapi/hapi['\"]|from ['\"]@hapi/hapi['\"]"; then
        return 0
    fi

    # Check for Hapi server patterns
    if any_file_contains "*.js" "Hapi\.server\(|new Hapi\.Server"; then
        return 0
    fi

    return 1
}

# ============================================
# REST API Detection (generic)
# ============================================
detect_rest_api() {
    # If it's a microservice with controllers or routes
    if any_file_contains "*.java" "@RestController|@RequestMapping|@GetMapping|@PostMapping"; then
        return 0
    fi

    # Node.js route patterns
    if any_file_contains "*.js" "router\.(get|post|put|delete)|app\.(get|post|put|delete)"; then
        return 0
    fi

    # Hapi routes
    if any_file_contains "*.js" "server\.route\("; then
        return 0
    fi

    return 1
}

# ============================================
# GDS/GOV.UK Frontend Detection
# ============================================
detect_gds() {
    # Check for govuk-frontend in package.json
    if file_contains "package.json" '"govuk-frontend"'; then
        return 0
    fi

    # Check for GDS templates (Nunjucks) - check common view locations
    for dir in "$REPO_PATH/src/views" "$REPO_PATH/views" "$REPO_PATH/service/src/views" "$REPO_PATH/service/views"; do
        if [[ -d "$dir" ]]; then
            if any_file_contains "*.njk" "govukButton|govukInput|govukRadios|govukCheckboxes"; then
                return 0
            fi
            break
        fi
    done

    # Check for GDS classes in templates
    if any_file_contains "*.njk" "govuk-"; then
        return 0
    fi

    return 1
}

# ============================================
# Run detections
# ============================================

if detect_k6; then
    technologies+=("k6")
    best_practices+=("docs/best-practices/k6/BEST_PRACTICES.md")
fi

if detect_playwright; then
    technologies+=("playwright")
    best_practices+=("docs/best-practices/playwright/BEST_PRACTICES.md")
fi

if detect_springboot; then
    technologies+=("springboot")
    best_practices+=("docs/best-practices/java/spring-boot.md")
    best_practices+=("docs/best-practices/java/modern-java.md")
    best_practices+=("docs/best-practices/java/testing/unit.md")
    best_practices+=("docs/best-practices/java/testing/integration.md")

    if file_contains "pom.xml" "spring-boot-starter-data-mongodb|spring-data-mongodb" || file_contains "build.gradle" "spring-boot-starter-data-mongodb|spring-data-mongodb"; then
        technologies+=("spring-data-mongodb")
        best_practices+=("docs/best-practices/java/spring-data-mongodb.md")
    fi

    if file_contains "pom.xml" "springdoc-openapi" || file_contains "build.gradle" "springdoc-openapi"; then
        technologies+=("openapi-springdoc")
        best_practices+=("docs/best-practices/java/openapi-springdoc.md")
    fi

    if file_contains "pom.xml" "software\.amazon\.awssdk" || file_contains "build.gradle" "software\.amazon\.awssdk"; then
        technologies+=("aws-sdk-v2")
        best_practices+=("docs/best-practices/java/aws-sdk-v2.md")
    fi
fi

if detect_hapi; then
    technologies+=("hapi")
    best_practices+=("docs/best-practices/node/hapi.md")
fi

if file_contains "package.json" '"pino"|"hapi-pino"'; then
    technologies+=("pino")
    best_practices+=("docs/best-practices/node/pino-logging.md")
fi

if file_contains "package.json" '"nunjucks"'; then
    technologies+=("nunjucks")
    best_practices+=("docs/best-practices/node/nunjucks.md")
fi

if detect_rest_api; then
    technologies+=("rest-api")
    best_practices+=("docs/best-practices/rest-api/rest-api.md")
fi

if detect_gds; then
    technologies+=("gds")
    best_practices+=("docs/best-practices/gds/language.md")
    best_practices+=("docs/best-practices/gds/styles.md")
    best_practices+=("docs/best-practices/gds/components.md")
    best_practices+=("docs/best-practices/gds/patterns.md")
    best_practices+=("docs/best-practices/gds/accessibility.md")
    best_practices+=("docs/best-practices/node/govuk-frontend.md")
    best_practices+=("docs/best-practices/node/code-style.md")
    best_practices+=("docs/best-practices/node/testing/frontend.md")
fi

# Sonar way rules apply to all Java/JS repos (CI SonarCloud + IDE plugin)
if file_exists "pom.xml" || file_exists "package.json"; then
    technologies+=("sonar")
    best_practices+=("docs/best-practices/sonar/common-rules.md")
fi

# ============================================
# Output JSON
# ============================================

# Build JSON arrays
tech_json=$(printf '%s\n' "${technologies[@]}" | jq -R . | jq -s .)
bp_json=$(printf '%s\n' "${best_practices[@]}" | jq -R . | jq -s .)

# Handle empty arrays
[[ ${#technologies[@]} -eq 0 ]] && tech_json="[]"
[[ ${#best_practices[@]} -eq 0 ]] && bp_json="[]"

echo "{\"technologies\":$tech_json,\"best_practices\":$bp_json}"
