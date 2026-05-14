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
# Flag parsing, usage text, and --exclude label validation live in lib/flags.sh
# — see its top-of-file comment for the contract.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$WORKSPACE_ROOT/docker/stack/compose.yml"
LIB_DIR="$SCRIPT_DIR/lib"

# label | compose service name | tag-override env var. Single source of truth
# for everything per-service the wrapper does (probe, summary, exclude
# translation, positional service list).
services=(
  "frontend|trade-imports-animals-frontend|TRADE_IMPORTS_ANIMALS_FRONTEND"
  "backend|trade-imports-animals-backend|TRADE_IMPORTS_ANIMALS_BACKEND"
  "admin|trade-imports-animals-admin|TRADE_IMPORTS_ANIMALS_ADMIN"
  "stub|trade-imports-stub|TRADE_IMPORTS_STUB"
  "reference-data|trade-imports-reference-data|TRADE_IMPORTS_REFERENCE_DATA"
)

# Infra services — always in the stack, never excludable, no probe / env var.
# Disjoint from `services` above so the two can't drift.
infra_services=(mongodb localstack localstack-init redis trade-imports-defra-id-stub cdp-uploader)

valid_labels=()
for entry in "${services[@]}"; do
  valid_labels+=("${entry%%|*}")
done

# shellcheck source=lib/flags.sh
source "$LIB_DIR/flags.sh"
parse_run_stack_flags "$@"

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

sanitised=""
if [ -n "$branch" ]; then
  sanitised="$(sanitise_branch "$branch")"
  if [ -z "$sanitised" ]; then
    echo "error: branch '$branch' is empty after sanitisation" >&2
    exit 1
  fi
  echo "Probing Dockerhub for branch tag: $sanitised"
fi

up_services=()
for entry in "${services[@]}"; do
  IFS='|' read -r label image env_var <<< "$entry"
  if is_excluded "$label"; then
    unset "$env_var" 2>/dev/null || true
    printf '  %-16s excluded\n' "$label:"
    continue
  fi
  if [ -n "$sanitised" ] && probe "$image" "$sanitised"; then
    export "$env_var=$sanitised"
    printf '  %-16s branch  (%s)\n' "$label:" "$sanitised"
  else
    unset "$env_var" 2>/dev/null || true
    printf '  %-16s latest\n' "$label:"
  fi
  up_services+=("$image")
done
up_services+=("${infra_services[@]}")

[ ${#up_services[@]} -gt 0 ] || { echo "error: would start no services" >&2; exit 1; }

exec docker compose -f "$COMPOSE_FILE" up --wait --detach ${extra[@]+"${extra[@]}"} "${up_services[@]}"
