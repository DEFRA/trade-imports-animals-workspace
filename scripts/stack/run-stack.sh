#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STACK_DIR="$WORKSPACE_ROOT/docker/stack"
LIB_DIR="$SCRIPT_DIR/lib"

services=(
  "frontend|trade-imports-animals-frontend|TRADE_IMPORTS_ANIMALS_FRONTEND"
  "backend|trade-imports-animals-backend|TRADE_IMPORTS_ANIMALS_BACKEND"
  "admin|trade-imports-animals-admin|TRADE_IMPORTS_ANIMALS_ADMIN"
  "stub|trade-imports-stub|TRADE_IMPORTS_STUB"
  "defra-id-stub|trade-imports-defra-id-stub|TRADE_IMPORTS_DEFRA_ID_STUB"
  "reference-data|trade-imports-reference-data|TRADE_IMPORTS_REFERENCE_DATA"
  "gateway|trade-imports-dynamics-gateway|TRADE_IMPORTS_DYNAMICS_GATEWAY"
)

valid_labels=()
for entry in "${services[@]}"; do
  valid_labels+=("${entry%%|*}")
done

# shellcheck source=lib/colour.sh
source "$LIB_DIR/colour.sh"
# shellcheck source=lib/compose.sh
source "$LIB_DIR/compose.sh"

valid_profiles=("${ALL_PROFILES[@]}")

# shellcheck source=lib/flags.sh
source "$LIB_DIR/flags.sh"
parse_run_stack_flags "$@"

# shellcheck source=lib/init-scripts.sh
source "$LIB_DIR/init-scripts.sh"
stage_init_scripts "$branch"

[ ${#selected_profiles[@]} -eq 0 ] && selected_profiles=("${valid_profiles[@]}")
[ "$dev" -eq 1 ] && compose_files_add_dev

# Sanitisation must match the per-repo publish-branch.yml workflows.
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

profile_args=()
for profile in "${selected_profiles[@]}"; do
  profile_args+=(--profile "$profile")
done

active_services=()
compose_config_err="$(mktemp)"
while IFS= read -r svc; do
  [ -n "$svc" ] && active_services+=("$svc")
done < <(docker compose "${COMPOSE_FILES[@]}" "${profile_args[@]}" config --services 2>"$compose_config_err" | sort)
if [ ${#active_services[@]} -eq 0 ]; then
  print_error "error: no services resolved from compose config — the compose files may be invalid"
  [ -s "$compose_config_err" ] && print_error "$(cat "$compose_config_err")"
  rm -f "$compose_config_err"
  exit 1
fi
rm -f "$compose_config_err"

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

printf '%sProfiles:%s %s\n' "$COLOUR_BOLD" "$COLOUR_RESET" "${selected_profiles[*]}"
sanitised=""
if [ -n "$branch" ]; then
  sanitised="$(sanitise_branch "$branch")"
  if [ -z "$sanitised" ]; then
    print_error "error: branch '$branch' is empty after sanitisation"
    exit 1
  fi
  printf '%sProbing Dockerhub for branch tag: %s%s\n' "$COLOUR_CYAN" "$sanitised" "$COLOUR_RESET"
fi

# Fan out the branch-tag probes concurrently. docker manifest inspect is a
# network round-trip per service; running them in parallel turns 7 sequential
# round-trips into one wall-clock round-trip. Each job touches a marker file on
# success; the print loop below reads the markers so all env-var exports still
# happen in this (parent) shell. bash-3.2 safe (macOS default) and Linux-CI safe:
# only mktemp -d, background jobs, and a bare wait barrier are used.
probe_tmpdir=""
if [ -n "$sanitised" ] && [ "$dev" -ne 1 ]; then
  probe_tmpdir="$(mktemp -d)"
  probe_pids=()
  for entry in "${services[@]}"; do
    IFS='|' read -r label image _ <<< "$entry"
    is_excluded "$label" && continue
    in_active=0
    for s in ${active_services[@]+"${active_services[@]}"}; do
      [ "$s" = "$image" ] && { in_active=1; break; }
    done
    [ "$in_active" -eq 0 ] && continue
    ( probe "$image" "$sanitised" && : > "$probe_tmpdir/$label" ) &
    probe_pids+=("$!")
  done
  [ ${#probe_pids[@]} -gt 0 ] && wait ${probe_pids[@]+"${probe_pids[@]}"} 2>/dev/null || true
fi

for entry in "${services[@]}"; do
  IFS='|' read -r label image env_var <<< "$entry"
  if is_excluded "$label"; then
    unset "$env_var" 2>/dev/null
    printf '  %-16s %sexcluded%s\n' "$label:" "$COLOUR_GREY" "$COLOUR_RESET"
    continue
  fi
  in_active=0
  for s in ${active_services[@]+"${active_services[@]}"}; do
    [ "$s" = "$image" ] && { in_active=1; break; }
  done
  [ "$in_active" -eq 0 ] && continue
  if [ "$dev" -eq 1 ]; then
    unset "$env_var" 2>/dev/null
    printf '  %-16s %sbuilt (source)%s\n' "$label:" "$COLOUR_GREEN" "$COLOUR_RESET"
  elif [ -n "$sanitised" ] && [ -f "$probe_tmpdir/$label" ]; then
    export "$env_var=$sanitised"
    printf '  %-16s %sbranch  (%s)%s\n' "$label:" "$COLOUR_GREEN" "$sanitised" "$COLOUR_RESET"
  else
    unset "$env_var" 2>/dev/null
    printf '  %-16s latest\n' "$label:"
  fi
done

[ ${#up_services[@]} -gt 0 ] || { print_error "error: would start no services"; exit 1; }

[ -n "$probe_tmpdir" ] && rm -rf "$probe_tmpdir"

up_args=(up --wait --detach --pull always)
[ "$dev" -eq 1 ] && up_args+=(--build)

exec docker compose "${COMPOSE_FILES[@]}" "${profile_args[@]}" "${up_args[@]}" ${extra[@]+"${extra[@]}"} "${up_services[@]}"
