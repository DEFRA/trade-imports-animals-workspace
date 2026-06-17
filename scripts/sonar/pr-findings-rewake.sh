#!/bin/bash
#
# pr-findings-rewake.sh — async git-push hook that surfaces SonarCloud PR findings.
#
# Wired as an async + asyncRewake PostToolUse hook on `git push` (see
# docs/agent-onboarding.md §4). Because this SonarCloud org has Agentic Analysis
# disabled, code findings only exist after the "Check Pull Request" GitHub Action
# runs the server-side scan (~3 min after a push). This hook therefore runs in the
# background, waits for SonarCloud to analyze the pushed commit, then pulls any new
# BLOCKER/CRITICAL issues and wakes the session (exit 2) so they can be addressed.
#
# Depends only on `sonar`, `jq`, `git`. Fails open (exit 0) on any missing
# dependency, timeout, or error — it never blocks the push and never nags.
#
# Exit codes: 0 = nothing to report (or could not check); 2 = findings present,
# wake the model with the summary printed to stdout.
#
# Targets bash 3.2 (macOS stock): no associative arrays, no mapfile, no `set -u`
# (empty indexed-array expansion is unsafe there) — guard everything explicitly.

ROOT="${CLAUDE_PROJECT_DIR:-$HOME/git/defra/trade-imports-animals}"

# repo dir (under $ROOT/repos) -> SonarCloud project key. Only the four repos
# with a SonarCloud project are listed; the gateway key has no "animals" segment.
SONAR_REPOS=(
  "trade-imports-animals-frontend:DEFRA_trade-imports-animals-frontend"
  "trade-imports-animals-admin:DEFRA_trade-imports-animals-admin"
  "trade-imports-animals-backend:DEFRA_trade-imports-animals-backend"
  "trade-imports-dynamics-gateway:DEFRA_trade-imports-dynamics-gateway"
)

DEFAULT_BRANCHES_RE='^(main|master)$'
MAX_WAIT_SECONDS=420   # CI scan typically lands within ~3-4 min of a push
POLL_INTERVAL=20
STATE_DIR="${TMPDIR:-/tmp}/sonar-rewake"

# Fail open if anything we need is missing.
command -v sonar >/dev/null 2>&1 || exit 0
command -v jq >/dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0

mkdir -p "$STATE_DIR" 2>/dev/null || exit 0

# Build the candidate list: sonar repos on a feature branch whose local HEAD
# matches its pushed upstream (i.e. there is a pushed commit for SonarCloud to
# analyze). Each candidate is "project<TAB>branch<TAB>headSha".
candidates=()
for entry in "${SONAR_REPOS[@]}"; do
  repo_name="${entry%%:*}"
  project="${entry##*:}"
  repo_dir="$ROOT/repos/$repo_name"
  [ -d "$repo_dir/.git" ] || [ -f "$repo_dir/.git" ] || continue

  branch=$(git -C "$repo_dir" symbolic-ref --short -q HEAD 2>/dev/null) || continue
  [ -n "$branch" ] || continue
  [[ "$branch" =~ $DEFAULT_BRANCHES_RE ]] && continue

  head_sha=$(git -C "$repo_dir" rev-parse HEAD 2>/dev/null) || continue
  upstream_sha=$(git -C "$repo_dir" rev-parse '@{upstream}' 2>/dev/null) || continue
  # Only consider repos whose HEAD is actually pushed — otherwise there is
  # nothing on the remote for SonarCloud to have analyzed.
  [ "$head_sha" = "$upstream_sha" ] || continue

  # Skip if we have already reported on this exact analyzed commit.
  marker="$STATE_DIR/${project}-${head_sha}"
  [ -f "$marker" ] && continue

  candidates+=("${project}	${branch}	${head_sha}")
done

[ "${#candidates[@]}" -eq 0 ] && exit 0

# Resolve each candidate to the PR whose latest analyzed commit equals the pushed
# HEAD, polling until SonarCloud catches up or we hit the wait ceiling. Holds
# "project<TAB>prKey<TAB>headSha". Uses plain indexed arrays (no associative
# arrays / mapfile) so it runs under macOS's stock bash 3.2.
resolved=()
pending=("${candidates[@]}")
waited=0
while [ "${#pending[@]}" -gt 0 ]; do
  still=()
  for c in "${pending[@]}"; do
    IFS=$'\t' read -r project branch head_sha <<<"$c"

    pr_json=$(sonar api get "/api/project_pull_requests/list?project=${project}" 2>/dev/null)
    pr_key=$(printf '%s' "$pr_json" | jq -r --arg b "$branch" --arg sha "$head_sha" \
      'first(.pullRequests[]? | select(.branch == $b and .commit.sha == $sha) | .key) // empty' 2>/dev/null)

    if [ -n "$pr_key" ]; then
      resolved+=("${project}	${pr_key}	${head_sha}")
    else
      still+=("$c")
    fi
  done

  pending=("${still[@]}")
  [ "${#pending[@]}" -eq 0 ] && break
  [ "$waited" -ge "$MAX_WAIT_SECONDS" ] && break
  sleep "$POLL_INTERVAL"
  waited=$((waited + POLL_INTERVAL))
done

# Pull new BLOCKER/CRITICAL issues for each analyzed PR and build the report.
report=""
for r in "${resolved[@]}"; do
  IFS=$'\t' read -r project pr_key head_sha <<<"$r"

  issues_json=$(sonar list issues --project "$project" --pull-request "$pr_key" \
    --severities BLOCKER,CRITICAL --statuses OPEN,CONFIRMED --format json 2>/dev/null) || continue

  lines=$(printf '%s' "$issues_json" | jq -r \
    '.issues[]? | "  [\(.severity)] \((.component // "") | sub("^[^:]*:"; "")):\(.textRange.startLine // .line // "?") \(.rule) — \(.message)"' \
    2>/dev/null)

  # Mark this commit handled regardless of outcome so re-pushes do not re-nag.
  touch "$STATE_DIR/${project}-${head_sha}" 2>/dev/null

  if [ -n "$lines" ]; then
    report+="${project} (PR #${pr_key}):"$'\n'"${lines}"$'\n'
  fi
done

if [ -n "$report" ]; then
  printf 'New BLOCKER/CRITICAL SonarCloud issues on your pushed PR(s) — fix before merge:\n%s' "$report"
  exit 2
fi

exit 0
