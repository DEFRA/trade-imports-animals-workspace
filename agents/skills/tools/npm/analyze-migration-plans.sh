#!/bin/bash
# Analyze all migration plans to identify upgrade categories
# Usage: ./analyze-migration-plans.sh --run-id TICKET [--json]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"

RUN_ID=""
JSON_OUTPUT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id)
            RUN_ID="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./analyze-migration-plans.sh --run-id TICKET [--json]"
            exit 1
            ;;
    esac
done

if [[ -z "$RUN_ID" ]]; then
    echo "Error: --run-id TICKET is required (e.g. --run-id EUDPA-12345)" >&2
    exit 1
fi

# Warn if RUN_ID doesn't look like a Jira ticket
if [[ ! "$RUN_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "Warning: --run-id '$RUN_ID' does not match expected Jira ticket format (e.g. PROJ-123)" >&2
fi

WORKSPACE_DIR="$AGENTS_DIR/workareas/npm-upgrades/$RUN_ID"

# Extract risk level from migration plan content
get_risk_level() {
    local file="$1"

    # Extract content of Risk Assessment section
    local risk_section
    risk_section=$(awk '
        $0 ~ "^## Risk Assessment" {found=1; next}
        found && /^## / {found=0}
        found {print}
    ' "$file")

    # Look for Overall Risk or Risk Level
    if echo "$risk_section" | grep -qi "overall risk.*low\|risk level.*low\|\*\*low\*\*"; then
        echo "LOW"
    elif echo "$risk_section" | grep -qi "overall risk.*medium\|risk level.*medium\|\*\*medium\*\*"; then
        echo "MEDIUM"
    elif echo "$risk_section" | grep -qi "overall risk.*high\|risk level.*high\|\*\*high\*\*"; then
        echo "HIGH"
    else
        echo "UNKNOWN"
    fi
}

# Extract package name and versions from filename
# Handles both .auto.md and .manual.md extensions
parse_filename() {
    local filename="$1"
    # Format: upgrade__package__current__target.auto.md or .manual.md
    # Handle scoped packages: upgrade__@scope__name__current__target.auto.md

    local base
    base=$(basename "$filename")
    base="${base%.auto.md}"
    base="${base%.manual.md}"
    base="${base#upgrade__}"

    # Split by __
    IFS='__' read -ra parts <<< "$base"

    if [[ "${parts[0]}" == "@"* ]]; then
        # Scoped package: @scope__name__current__target
        package="${parts[0]}/${parts[1]}"
        current="${parts[2]}"
        target="${parts[3]}"
    else
        # Regular package: name__current__target
        package="${parts[0]}"
        current="${parts[1]}"
        target="${parts[2]}"
    fi

    echo "$package|$current|$target"
}

# Analyze all migration plans
analyze_all() {
    local auto_upgrades=()
    local manual_upgrades=()
    local pending_stubs=()
    local low_risk=()
    local medium_risk=()
    local high_risk=()

    if [ "$JSON_OUTPUT" = "false" ]; then
        echo "Analyzing migration plans across all repositories..."
        echo ""
    fi

    for repo_dir in "$WORKSPACE_DIR"/trade-imports-animals-*; do
        if [ ! -d "$repo_dir" ]; then
            continue
        fi

        repo_name=$(basename "$repo_dir")

        # Auto plans (no code changes required)
        for plan_file in "$repo_dir"/upgrade__*.auto.md; do
            if [ ! -f "$plan_file" ]; then
                continue
            fi

            IFS='|' read -r package current target <<< "$(parse_filename "$plan_file")"
            risk=$(get_risk_level "$plan_file")

            entry="$repo_name|$package|$current|$target|$risk"
            auto_upgrades+=("$entry")

            case "$risk" in
                LOW) low_risk+=("$entry") ;;
                MEDIUM) medium_risk+=("$entry") ;;
                HIGH) high_risk+=("$entry") ;;
            esac
        done

        # Manual plans (code changes required)
        for plan_file in "$repo_dir"/upgrade__*.manual.md; do
            if [ ! -f "$plan_file" ]; then
                continue
            fi

            IFS='|' read -r package current target <<< "$(parse_filename "$plan_file")"
            risk=$(get_risk_level "$plan_file")

            entry="$repo_name|$package|$current|$target|$risk"
            manual_upgrades+=("$entry")

            case "$risk" in
                LOW) low_risk+=("$entry") ;;
                MEDIUM) medium_risk+=("$entry") ;;
                HIGH) high_risk+=("$entry") ;;
            esac
        done

        # Pending stubs (not yet planned)
        for plan_file in "$repo_dir"/upgrade__*.md; do
            # Skip files already classified
            [[ "$plan_file" == *.auto.md ]] && continue
            [[ "$plan_file" == *.manual.md ]] && continue
            if [ ! -f "$plan_file" ]; then
                continue
            fi

            IFS='|' read -r package current target <<< "$(parse_filename "$plan_file")"
            pending_stubs+=("$repo_name|$package|$current|$target")
        done
    done

    # Output results
    if [ "$JSON_OUTPUT" = "true" ]; then
        output_json
    else
        output_human
    fi
}

output_human() {
    echo "========================================="
    echo "Migration Plan Analysis ($RUN_ID)"
    echo "========================================="
    echo ""

    echo "📊 Overall Statistics:"
    echo "  Automated (no code changes): ${#auto_upgrades[@]}"
    echo "  Manual (code changes required): ${#manual_upgrades[@]}"
    echo "  Pending planning (stubs): ${#pending_stubs[@]}"
    echo "  Low risk: ${#low_risk[@]}"
    echo "  Medium risk: ${#medium_risk[@]}"
    echo "  High risk: ${#high_risk[@]}"
    echo ""

    if [ ${#pending_stubs[@]} -gt 0 ]; then
        echo "========================================="
        echo "📝 PENDING PLANNING (stubs not yet researched)"
        echo "========================================="
        printf "%-35s %-40s %-15s %-15s\n" "REPO" "PACKAGE" "CURRENT" "TARGET"
        printf "%-35s %-40s %-15s %-15s\n" "----" "-------" "-------" "------"
        for entry in "${pending_stubs[@]}"; do
            IFS='|' read -r repo package current target <<< "$entry"
            printf "%-35s %-40s %-15s %-15s\n" "$repo" "$package" "$current" "$target"
        done | sort
        echo ""
    fi

    echo "========================================="
    echo "🤖 AUTOMATED UPGRADES (no code changes)"
    echo "========================================="
    if [ ${#auto_upgrades[@]} -eq 0 ]; then
        echo "None found"
    else
        printf "%-35s %-40s %-15s %-15s %-10s\n" "REPO" "PACKAGE" "CURRENT" "TARGET" "RISK"
        printf "%-35s %-40s %-15s %-15s %-10s\n" "----" "-------" "-------" "------" "----"
        for entry in "${auto_upgrades[@]}"; do
            IFS='|' read -r repo package current target risk <<< "$entry"
            printf "%-35s %-40s %-15s %-15s %-10s\n" "$repo" "$package" "$current" "$target" "$risk"
        done | sort
    fi
    echo ""

    echo "========================================="
    echo "🔧 MANUAL UPGRADES (code changes required)"
    echo "========================================="
    if [ ${#manual_upgrades[@]} -eq 0 ]; then
        echo "None found"
    else
        printf "%-35s %-40s %-15s %-15s %-10s\n" "REPO" "PACKAGE" "CURRENT" "TARGET" "RISK"
        printf "%-35s %-40s %-15s %-15s %-10s\n" "----" "-------" "-------" "------" "----"
        for entry in "${manual_upgrades[@]}"; do
            IFS='|' read -r repo package current target risk <<< "$entry"
            printf "%-35s %-40s %-15s %-15s %-10s\n" "$repo" "$package" "$current" "$target" "$risk"
        done | sort
    fi
    echo ""

    echo "========================================="
    echo "⚠️  HIGH RISK UPGRADES"
    echo "========================================="
    if [ ${#high_risk[@]} -eq 0 ]; then
        echo "None found"
    else
        printf "%-35s %-40s %-15s %-15s %-10s\n" "REPO" "PACKAGE" "CURRENT" "TARGET" "RISK"
        printf "%-35s %-40s %-15s %-15s %-10s\n" "----" "-------" "-------" "------" "----"
        for entry in "${high_risk[@]}"; do
            IFS='|' read -r repo package current target risk <<< "$entry"
            printf "%-35s %-40s %-15s %-15s %-10s\n" "$repo" "$package" "$current" "$target" "$risk"
        done | sort
    fi
    echo ""

    echo "========================================="
    echo "💡 Recommendations"
    echo "========================================="
    if [ ${#pending_stubs[@]} -gt 0 ]; then
        echo "0. Spawn PLANNER agents for ${#pending_stubs[@]} unresearched stubs first"
    fi
    echo "1. Run automated upgrades (${#auto_upgrades[@]} packages)"
    echo "   ./tools/npm/run-automated-upgrades.sh <repo-name> --run-id $RUN_ID"
    echo "2. Review and plan manual upgrades (${#manual_upgrades[@]} packages)"
    echo "3. Review medium risk upgrades (${#medium_risk[@]} packages)"
    echo "4. Carefully plan high risk upgrades with team discussion (${#high_risk[@]} packages)"
    echo ""
}

output_json() {
    echo "{"
    echo "  \"run_id\": \"$RUN_ID\","
    echo "  \"summary\": {"
    echo "    \"automated\": ${#auto_upgrades[@]},"
    echo "    \"manual\": ${#manual_upgrades[@]},"
    echo "    \"pending_stubs\": ${#pending_stubs[@]},"
    echo "    \"low_risk\": ${#low_risk[@]},"
    echo "    \"medium_risk\": ${#medium_risk[@]},"
    echo "    \"high_risk\": ${#high_risk[@]}"
    echo "  },"
    echo "  \"categories\": {"
    echo "    \"automated\": ["

    for i in "${!auto_upgrades[@]}"; do
        IFS='|' read -r repo package current target risk <<< "${auto_upgrades[$i]}"
        echo "      {"
        echo "        \"repo\": \"$repo\","
        echo "        \"package\": \"$package\","
        echo "        \"current\": \"$current\","
        echo "        \"target\": \"$target\","
        echo "        \"risk\": \"$risk\""
        if [ $i -lt $((${#auto_upgrades[@]} - 1)) ]; then
            echo "      },"
        else
            echo "      }"
        fi
    done

    echo "    ],"
    echo "    \"manual\": ["

    for i in "${!manual_upgrades[@]}"; do
        IFS='|' read -r repo package current target risk <<< "${manual_upgrades[$i]}"
        echo "      {"
        echo "        \"repo\": \"$repo\","
        echo "        \"package\": \"$package\","
        echo "        \"current\": \"$current\","
        echo "        \"target\": \"$target\","
        echo "        \"risk\": \"$risk\""
        if [ $i -lt $((${#manual_upgrades[@]} - 1)) ]; then
            echo "      },"
        else
            echo "      }"
        fi
    done

    echo "    ],"
    echo "    \"pending_stubs\": ["

    for i in "${!pending_stubs[@]}"; do
        IFS='|' read -r repo package current target <<< "${pending_stubs[$i]}"
        echo "      {"
        echo "        \"repo\": \"$repo\","
        echo "        \"package\": \"$package\","
        echo "        \"current\": \"$current\","
        echo "        \"target\": \"$target\""
        if [ $i -lt $((${#pending_stubs[@]} - 1)) ]; then
            echo "      },"
        else
            echo "      }"
        fi
    done

    echo "    ],"
    echo "    \"high_risk\": ["

    for i in "${!high_risk[@]}"; do
        IFS='|' read -r repo package current target risk <<< "${high_risk[$i]}"
        echo "      {"
        echo "        \"repo\": \"$repo\","
        echo "        \"package\": \"$package\","
        echo "        \"current\": \"$current\","
        echo "        \"target\": \"$target\","
        echo "        \"risk\": \"$risk\""
        if [ $i -lt $((${#high_risk[@]} - 1)) ]; then
            echo "      },"
        else
            echo "      }"
        fi
    done

    echo "    ]"
    echo "  }"
    echo "}"
}

# Run analysis
analyze_all
