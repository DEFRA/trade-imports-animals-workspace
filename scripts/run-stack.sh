#!/usr/bin/env bash
# Bring up the workspace docker stack with branch-tagged images where they
# exist and `:latest` elsewhere.
#
# Branch-name sanitisation MUST stay byte-for-byte identical to the per-repo
# publish-branch.yml workflows (canonical reference:
# repos/trade-imports-stub/.github/workflows/publish-branch.yml lines 35-46).
# Drift surfaces as "branch image not found → falls back to latest" in the
# per-service summary below.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$WORKSPACE_ROOT/docker/stack/compose.yml"

usage() {
  cat <<EOF
Usage: $(basename "$0") [--branch <name>] [-- <extra docker compose up args>]

  --branch <name>   Branch ref to probe per service. Sanitised to match the
                    per-repo publish-branch.yml workflows. A service whose
                    Dockerhub tag exists at \`defradigital/<svc>:<sanitised>\`
                    runs that image; otherwise falls back to \`:latest\`.
  -h, --help        Show this help.

Anything after \`--\` is forwarded verbatim to \`docker compose ... up\`.

If \`docker manifest inspect\` starts failing after many invocations, run
\`docker login\` — anonymous Dockerhub manifest pulls are rate-limited.
EOF
}

branch=""
extra=()
while [ $# -gt 0 ]; do
  case "$1" in
    --branch)
      [ $# -ge 2 ] || { echo "error: --branch requires a value" >&2; exit 2; }
      branch="$2"
      shift 2
      ;;
    --branch=*)
      branch="${1#--branch=}"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      extra=("$@")
      break
      ;;
    *)
      echo "error: unexpected argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

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

services=(
  "frontend|trade-imports-animals-frontend|TRADE_IMPORTS_ANIMALS_FRONTEND"
  "backend|trade-imports-animals-backend|TRADE_IMPORTS_ANIMALS_BACKEND"
  "admin|trade-imports-animals-admin|TRADE_IMPORTS_ANIMALS_ADMIN"
  "stub|trade-imports-stub|TRADE_IMPORTS_STUB"
  "reference-data|trade-imports-reference-data|TRADE_IMPORTS_REFERENCE_DATA"
)

sanitised=""
if [ -n "$branch" ]; then
  sanitised="$(sanitise_branch "$branch")"
  if [ -z "$sanitised" ]; then
    echo "error: branch '$branch' is empty after sanitisation" >&2
    exit 1
  fi
  echo "Probing Dockerhub for branch tag: $sanitised"
fi

for entry in "${services[@]}"; do
  IFS='|' read -r label image env_var <<< "$entry"
  if [ -n "$sanitised" ] && probe "$image" "$sanitised"; then
    export "$env_var=$sanitised"
    printf '  %-16s branch  (%s)\n' "$label:" "$sanitised"
  else
    unset "$env_var" 2>/dev/null || true
    printf '  %-16s latest\n' "$label:"
  fi
done

exec docker compose -f "$COMPOSE_FILE" up --wait --detach ${extra[@]+"${extra[@]}"}
