#!/usr/bin/env bash
# Bring up the workspace docker stack with branch-tagged images where they
# exist and `:latest` elsewhere.
#
# Branch-name sanitisation MUST stay byte-for-byte identical to the per-repo
# publish-branch.yml workflows (canonical reference:
# repos/trade-imports-stub/.github/workflows/publish-branch.yml lines 35-46).
# Drift surfaces as "branch image not found → falls back to latest" in the
# per-service summary below.
#
# Flag parsing, usage text, and --exclude / --profile validation live in
# lib/flags.sh — see its top-of-file comment for the contract.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STACK_DIR="$WORKSPACE_ROOT/docker/stack"
LIB_DIR="$SCRIPT_DIR/lib"

# label | compose service name | tag-override env var. Single source of truth
# for everything per-service the wrapper does (probe, summary, exclude
# translation).
services=(
  "frontend|trade-imports-animals-frontend|TRADE_IMPORTS_ANIMALS_FRONTEND"
  "backend|trade-imports-animals-backend|TRADE_IMPORTS_ANIMALS_BACKEND"
  "admin|trade-imports-animals-admin|TRADE_IMPORTS_ANIMALS_ADMIN"
  "stub|trade-imports-stub|TRADE_IMPORTS_STUB"
  "reference-data|trade-imports-reference-data|TRADE_IMPORTS_REFERENCE_DATA"
)

valid_labels=()
for entry in "${services[@]}"; do
  valid_labels+=("${entry%%|*}")
done

# Compose profiles — one per overlay file. Default (no --profile) brings up
# every profile, which is the same set as before profiles existed.
valid_profiles=(database infrastructure stubs backend frontend)

# shellcheck source=lib/colour.sh
source "$LIB_DIR/colour.sh"
# shellcheck source=lib/compose.sh
source "$LIB_DIR/compose.sh"
# shellcheck source=lib/flags.sh
source "$LIB_DIR/flags.sh"
parse_run_stack_flags "$@"

# Default profile set: everything.
[ ${#selected_profiles[@]} -eq 0 ] && selected_profiles=("${valid_profiles[@]}")

# Mirror repos/trade-imports-stub/.github/workflows/publish-branch.yml:35-46.
sanitise_branch() {
  local raw="$1"
  local t="${raw//\//-}"
  t="$(printf '%s' "$t" | tr -cd 'a-zA-Z0-9_.-')"
  t="$(printf '%s' "$t" | tr '[:upper:]' '[:lower:]')"
  while [[ "$t" == [.-]* ]]; do t="${t:1}"; done
  t="${t:0:128}"
  printf '%s' "$t"
}

probe() {
  local image="$1" tag="$2"
  docker manifest inspect "defradigital/${image}:${tag}" >/dev/null 2>&1
}

is_excluded() {
  local label="$1" e
  [ ${#excluded_labels[@]} -eq 0 ] && return 1
  for e in "${excluded_labels[@]}"; do
    [ "$e" = "$label" ] && return 0
  done
  return 1
}

# Build --profile X args for docker compose.
profile_args=()
for profile in "${selected_profiles[@]}"; do
  profile_args+=(--profile "$profile")
done

# Ask compose which services are active given the selected profiles. This is
# the source of truth — no separate hardcoded mapping to drift from the YAML.
# Use a `while read` loop instead of `mapfile` for bash 3.2 compatibility.
active_services=()
while IFS= read -r svc; do
  [ -n "$svc" ] && active_services+=("$svc")
done < <(docker compose "${COMPOSE_FILES[@]}" "${profile_args[@]}" config --services 2>/dev/null | sort)

# Translate excluded labels → compose service names.
excluded_compose_names=()
for label in ${excluded_labels[@]+"${excluded_labels[@]}"}; do
  for entry in "${services[@]}"; do
    IFS='|' read -r l image _ <<< "$entry"
    if [ "$l" = "$label" ]; then
      excluded_compose_names+=("$image")
      break
    fi
  done
done

# up_services = active_services - excluded.
up_services=()
for svc in ${active_services[@]+"${active_services[@]}"}; do
  skip=0
  for excl in ${excluded_compose_names[@]+"${excluded_compose_names[@]}"}; do
    if [ "$svc" = "$excl" ]; then
      skip=1
      break
    fi
  done
  [ "$skip" -eq 1 ] && continue
  up_services+=("$svc")
done

# Profile summary.
printf '%sProfiles:%s %s\n' "$COLOUR_BOLD" "$COLOUR_RESET" "${selected_profiles[*]}"

# Branch probe (only if --branch passed).
sanitised=""
if [ -n "$branch" ]; then
  sanitised="$(sanitise_branch "$branch")"
  if [ -z "$sanitised" ]; then
    print_error "error: branch '$branch' is empty after sanitisation"
    exit 1
  fi
  printf '%sProbing Dockerhub for branch tag: %s%s\n' "$COLOUR_CYAN" "$sanitised" "$COLOUR_RESET"
fi

# Per-service summary for repo-backed services.
for entry in "${services[@]}"; do
  IFS='|' read -r label image env_var <<< "$entry"
  if is_excluded "$label"; then
    unset "$env_var" 2>/dev/null || true
    printf '  %-16s %sexcluded%s\n' "$label:" "$COLOUR_GREY" "$COLOUR_RESET"
    continue
  fi
  # Skip services not in the active profile set (no summary row).
  in_active=0
  for s in ${active_services[@]+"${active_services[@]}"}; do
    [ "$s" = "$image" ] && { in_active=1; break; }
  done
  [ "$in_active" -eq 0 ] && continue
  if [ -n "$sanitised" ] && probe "$image" "$sanitised"; then
    export "$env_var=$sanitised"
    printf '  %-16s %sbranch  (%s)%s\n' "$label:" "$COLOUR_GREEN" "$sanitised" "$COLOUR_RESET"
  else
    unset "$env_var" 2>/dev/null || true
    printf '  %-16s latest\n' "$label:"
  fi
done

[ ${#up_services[@]} -gt 0 ] || { print_error "error: would start no services"; exit 1; }

exec docker compose "${COMPOSE_FILES[@]}" "${profile_args[@]}" up --wait --detach --pull always ${extra[@]+"${extra[@]}"} "${up_services[@]}"
