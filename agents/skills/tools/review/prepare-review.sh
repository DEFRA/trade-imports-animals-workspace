#!/bin/bash
# Prepare review workspace for a JIRA ticket or branch
# Usage: ./prepare-review.sh EUDPA-XXXXX [--json]
#        ./prepare-review.sh --branch <branch-name> --desc "Description" [--repos repo1,repo2] [--json]
#
# Creates reviews/<id>/ with:
#   - ticket.md (ticket details, comments, confluence refs)
#   - repos/ (cloned at merge commits)
#   - .review-meta.json (state for other scripts)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"

# Parse arguments
TICKET=""
BRANCH=""
DESC=""
REPOS=""
JSON_OUTPUT=false
NO_TICKET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --branch)
            BRANCH="$2"
            NO_TICKET=true
            shift 2
            ;;
        --desc)
            DESC="$2"
            shift 2
            ;;
        --repos)
            REPOS="$2"
            shift 2
            ;;
        -*)
            echo "Unknown option: $1"
            exit 1
            ;;
        *)
            TICKET="$1"
            shift
            ;;
    esac
done

if [[ -z "$TICKET" ]] && [[ -z "$BRANCH" ]]; then
    echo "Usage: ./prepare-review.sh EUDPA-XXXXX [--json]"
    echo "       ./prepare-review.sh --branch <branch-name> --desc \"Description\" [--repos repo1,repo2] [--json]"
    echo ""
    echo "Creates a review workspace with ticket context and cloned repos."
    echo ""
    echo "Options:"
    echo "  --branch   Branch name to search for PRs (no-ticket mode)"
    echo "  --desc     Description for the review (required with --branch)"
    echo "  --repos    Comma-separated list of repos to search (optional)"
    echo "  --json     Output JSON format"
    exit 1
fi

# Determine review directory name
if [[ "$NO_TICKET" == "true" ]]; then
    # Sanitize branch name for directory: remove feature/ prefix, replace / with -
    REVIEW_ID=$(echo "$BRANCH" | sed 's|^feature/||' | tr '/' '-')
    if [[ -z "$DESC" ]]; then
        DESC="Branch review: $BRANCH"
    fi
else
    REVIEW_ID="$TICKET"
fi

REVIEW_DIR="$AGENTS_DIR/workareas/reviews/$REVIEW_ID"

# Helper for output
log() {
    if [[ "$JSON_OUTPUT" == "false" ]]; then
        echo "$1"
    fi
}

error() {
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"error\": \"$1\"}"
    else
        echo "Error: $1" >&2
    fi
    exit 1
}

# Check dependencies
command -v jq >/dev/null 2>&1 || error "jq is required"
command -v gh >/dev/null 2>&1 || error "GitHub CLI (gh) is required"

# Create directory structure
log "Creating review workspace..."
mkdir -p "$REVIEW_DIR/repos"
mkdir -p "$REVIEW_DIR/file-reviews"

if [[ "$NO_TICKET" == "true" ]]; then
    # No-ticket mode: skip JIRA, create simple ticket.md
    log "No-ticket mode: using branch $BRANCH"
    ticket_key="$REVIEW_ID"
    ticket_summary="$DESC"
    ticket_type="Branch Review"

    # Write simplified ticket.md
    log "Writing ticket.md..."
    cat > "$REVIEW_DIR/ticket.md" << EOF
# $REVIEW_ID

## Description

$DESC

## Branch

\`$BRANCH\`

## Acceptance Criteria

<!-- No ticket - define acceptance criteria manually -->

EOF
else
    # Standard mode: fetch from JIRA
    log "Fetching ticket details..."
    ticket_json=$("$TOOLS_DIR/jira/ticket.sh" "$TICKET" json 2>/dev/null) || error "Failed to fetch ticket $TICKET"

    # Extract ticket metadata
    ticket_key=$(echo "$ticket_json" | jq -r '.key')
    ticket_summary=$(echo "$ticket_json" | jq -r '.fields.summary')
    ticket_type=$(echo "$ticket_json" | jq -r '.fields.issuetype.name')
    ticket_status=$(echo "$ticket_json" | jq -r '.fields.status.name')
    ticket_priority=$(echo "$ticket_json" | jq -r '.fields.priority.name')
    ticket_assignee=$(echo "$ticket_json" | jq -r '.fields.assignee.displayName // "Unassigned"')
    ticket_parent=$(echo "$ticket_json" | jq -r '.fields.parent.key // "None"')
    ticket_labels=$(echo "$ticket_json" | jq -r '.fields.labels | join(", ")')
    ticket_description=$(echo "$ticket_json" | jq -r '.renderedFields.description // "No description"')

    # Fetch comments
    log "Fetching comments..."
    comments_json=$("$TOOLS_DIR/jira/comments.sh" "$TICKET" json 2>/dev/null) || comments_json="[]"
    comments_count=$(echo "$comments_json" | jq 'length')

    # Extract Confluence links from description
    log "Checking for Confluence links..."
    _atlassian_base="${JIRA_BASE_URL:?JIRA_BASE_URL is not set - see README.md}"
    confluence_links=$(echo "$ticket_description" | grep -oE "${_atlassian_base}/wiki/spaces/[^\"<>[:space:]]+" | sort -u || true)
    confluence_content=""

    if [[ -n "$confluence_links" ]]; then
        while IFS= read -r link; do
            [[ -z "$link" ]] && continue
            log "  Fetching: $link"
            page_content=$("$TOOLS_DIR/confluence/page.sh" "$link" 2>/dev/null) || continue
            confluence_content+="### $(echo "$page_content" | head -2 | tail -1 | sed 's/Title: //')"$'\n\n'
            confluence_content+="$page_content"$'\n\n'
        done <<< "$confluence_links"
    fi

    # Format comments for ticket.md
    comments_formatted=""
    if [[ "$comments_count" -gt 0 ]]; then
        comments_formatted=$(echo "$comments_json" | jq -r '.[] | "### \(.author.displayName) (\(.created | split("T")[0]))\n\(.body)\n"')
    fi

    # Write ticket.md
    log "Writing ticket.md..."
    cat > "$REVIEW_DIR/ticket.md" << EOF
# $ticket_key: $ticket_summary

## Metadata
- **Type:** $ticket_type
- **Status:** $ticket_status
- **Priority:** $ticket_priority
- **Labels:** $ticket_labels
- **Parent:** $ticket_parent
- **Assignee:** $ticket_assignee

## Description

$ticket_description

## Acceptance Criteria

<!-- Extract from description above - look for "AC:", "Acceptance Criteria:", numbered lists, Given/When/Then -->

## Comments ($comments_count)

$comments_formatted

## Confluence References

$confluence_content
EOF
fi

# Find PRs
log "Finding PRs..."

if [[ "$NO_TICKET" == "true" ]]; then
    # Search by branch name
    if [[ -n "$REPOS" ]]; then
        # Search specific repos
        prs_json="[]"
        IFS=',' read -ra REPO_ARRAY <<< "$REPOS"
        for repo in "${REPO_ARRAY[@]}"; do
            repo=$(echo "$repo" | xargs)  # trim whitespace
            log "  Searching $repo..."
            pr_result=$(gh pr list --repo "DEFRA/$repo" --head "$BRANCH" --json number,title,url,state 2>/dev/null) || continue
            if [[ -n "$pr_result" ]] && [[ "$pr_result" != "[]" ]]; then
                # Add repository info
                pr_result=$(echo "$pr_result" | jq --arg repo "$repo" '[.[] | . + {repository: {name: $repo}}]')
                if [[ "$prs_json" == "[]" ]]; then
                    prs_json="$pr_result"
                else
                    prs_json=$(echo "$prs_json" "$pr_result" | jq -s 'add')
                fi
            fi
        done
    else
        # Search all DEFRA repos by branch name
        prs_json=$(gh search prs "head:$BRANCH" --owner DEFRA --json number,title,repository,url,state 2>/dev/null) || prs_json="[]"
    fi
else
    # Search by ticket ID
    prs_json=$("$TOOLS_DIR/github/prs.sh" "$TICKET" json 2>/dev/null) || prs_json="[]"
fi

if [[ "$prs_json" == "[]" ]] || [[ -z "$prs_json" ]]; then
    log "No PRs found"
    prs_json="[]"
fi

# Process all PRs (open or merged) for pre-merge review context
pr_count=$(echo "$prs_json" | jq 'length')
cloned_repos=()
meta_prs=()

for ((i=0; i<pr_count; i++)); do
    pr_url=$(echo "$prs_json" | jq -r ".[$i].url")
    pr_number=$(echo "$prs_json" | jq -r ".[$i].number")
    pr_state=$(echo "$prs_json" | jq -r ".[$i].state")
    repo_name=$(echo "$prs_json" | jq -r ".[$i].repository.name")

    log "Processing $repo_name#$pr_number ($pr_state)..."

    # Get PR details
    pr_details=$("$TOOLS_DIR/github/pr-details.sh" "$repo_name" "$pr_number" json 2>/dev/null) || continue

    # Get changed files count
    files_changed=$(echo "$pr_details" | jq -r '.files[].path' | wc -l | tr -d ' ')

    # Determine which commit to checkout
    pr_merged_at=$(echo "$pr_details" | jq -r '.mergedAt // empty')

    if [[ -n "$pr_merged_at" ]] && [[ "$pr_merged_at" != "null" ]]; then
        # Merged PR: use merge commit
        target_commit=$(gh pr view "$pr_number" --repo "DEFRA/$repo_name" --json mergeCommit --jq '.mergeCommit.oid' 2>/dev/null)
        commit_type="merge"
    else
        # Open PR: use head commit (latest on PR branch)
        target_commit=$(gh pr view "$pr_number" --repo "DEFRA/$repo_name" --json headRefOid --jq '.headRefOid' 2>/dev/null)
        commit_type="head"
    fi

    if [[ -z "$target_commit" ]] || [[ "$target_commit" == "null" ]]; then
        log "  Could not get target commit"
        continue
    fi

    # Clone repo if not already cloned
    repo_dir="$REVIEW_DIR/repos/$repo_name"
    if [[ -d "$repo_dir" ]]; then
        log "  Repo already cloned, fetching and checking out $target_commit..."
        (cd "$repo_dir" && git fetch --quiet origin && git checkout --quiet "$target_commit") || {
            log "  Failed to checkout commit"
            continue
        }
    else
        log "  Cloning and checking out $target_commit ($commit_type)..."
        git clone --quiet "https://github.com/DEFRA/$repo_name.git" "$repo_dir" 2>/dev/null || {
            log "  Failed to clone repo"
            continue
        }
        (cd "$repo_dir" && git checkout --quiet "$target_commit") || {
            log "  Failed to checkout commit"
            continue
        }
    fi

    cloned_repos+=("$repo_name")

    # Detect technologies used in this repo
    tech_json=$("$SCRIPT_DIR/detect-tech.sh" "$repo_dir" 2>/dev/null) || tech_json='{"technologies":[],"best_practices":[]}'
    tech_list=$(echo "$tech_json" | jq -r '.technologies | join(", ")')

    meta_prs+=("{\"repo\": \"$repo_name\", \"pr\": $pr_number, \"commit\": \"$target_commit\", \"state\": \"$pr_state\", \"files\": $files_changed, \"tech\": $tech_json}")

    if [[ -n "$tech_list" ]] && [[ "$tech_list" != "" ]]; then
        log "  ✓ $repo_name#$pr_number at ${target_commit:0:7} ($commit_type, $files_changed files) [$tech_list]"
    else
        log "  ✓ $repo_name#$pr_number at ${target_commit:0:7} ($commit_type, $files_changed files)"
    fi
done

# Write meta file
meta_prs_json=$(printf '%s\n' "${meta_prs[@]}" | jq -s '.')

# Aggregate unique best practices across all repos
all_best_practices=$(echo "$meta_prs_json" | jq '[.[].tech.best_practices // [] | .[]] | unique')

cat > "$REVIEW_DIR/.review-meta.json" << EOF
{
    "id": "$REVIEW_ID",
    "ticket": "$TICKET",
    "branch": "$BRANCH",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "themes": ["code", "consistency"],
    "best_practices": $all_best_practices,
    "prs": $meta_prs_json
}
EOF

# Create file review placeholders
log ""
log "Creating file review placeholders..."
total_files=0
created_files=0

for ((i=0; i<pr_count; i++)); do
    repo=$(echo "$prs_json" | jq -r ".[$i].repository.name")
    pr_number=$(echo "$prs_json" | jq -r ".[$i].number")

    # Get file list from PR
    files=$("$TOOLS_DIR/github/pr-details.sh" "$repo" "$pr_number" files 2>/dev/null) || continue

    # Create repo subdirectory
    repo_review_dir="$REVIEW_DIR/file-reviews/$repo"
    mkdir -p "$repo_review_dir"

    while IFS= read -r filepath; do
        [[ -z "$filepath" ]] && continue
        ((total_files++))

        # Replace / with _ for nested paths in the review filename
        safe_path=$(echo "$filepath" | tr '/' '_')
        review_file="$repo_review_dir/${safe_path}.review.md"

        # Skip if already exists and has content (already reviewed)
        if [[ -f "$review_file" ]] && [[ -s "$review_file" ]]; then
            continue
        fi

        # Create empty file (0 bytes) - agent will fill it in
        touch "$review_file"
        ((created_files++))
        log "  Created: $repo/$filepath"
    done <<< "$files"
done

# Create consistency check stubs (one per unique repo)
log ""
log "Creating consistency check stubs..."
consistency_repos=()
for ((i=0; i<pr_count; i++)); do
    repo=$(echo "$prs_json" | jq -r ".[$i].repository.name")

    # Deduplicate
    already_seen=false
    for seen in "${consistency_repos[@]:-}"; do
        [[ "$seen" == "$repo" ]] && already_seen=true && break
    done
    [[ "$already_seen" == "true" ]] && continue

    consistency_repos+=("$repo")
    repo_review_dir="$REVIEW_DIR/file-reviews/$repo"
    mkdir -p "$repo_review_dir"

    stub="$repo_review_dir/_consistency-check.md"
    if [[ ! -f "$stub" ]] || [[ ! -s "$stub" ]]; then
        touch "$stub"
        log "  Created: $repo/_consistency-check.md"
    fi
done

# Output summary
if [[ "$JSON_OUTPUT" == "true" ]]; then
    cat "$REVIEW_DIR/.review-meta.json"
else
    echo ""
    echo "=== Review Workspace Ready ==="
    if [[ "$NO_TICKET" == "true" ]]; then
        echo "Review: $REVIEW_ID"
        echo "Branch: $BRANCH"
    else
        echo "Ticket: $TICKET ($ticket_type)"
    fi
    echo "Summary: $ticket_summary"
    echo "Directory: $REVIEW_DIR"
    echo ""
    echo "Created:"
    echo "  ✓ ticket.md"
    echo "  ✓ .review-meta.json"
    if [[ ${#cloned_repos[@]} -gt 0 ]]; then
        for repo in "${cloned_repos[@]}"; do
            echo "  ✓ repos/$repo/"
        done
    fi
    echo "  ✓ file-reviews/ ($created_files files)"
    echo "  ✓ _consistency-check.md stubs (${#consistency_repos[@]} repos)"
    echo ""
    echo "Next: Review each file, then run ./verify-coverage.sh $REVIEW_ID"
fi
