# Sourced by scripts/stack/run-stack.sh. Defines `usage` and
# `parse_run_stack_flags`. The parser writes to globals `branch`, `extra`,
# `excluded_labels`, `selected_profiles` (which it also initialises) and reads
# `valid_labels` + `valid_profiles` from the caller's scope. Requires
# lib/colour.sh sourced first for `print_error`. No shebang and no executable
# bit — this file is for sourcing, not running.

usage() {
  cat <<EOF
Usage: $(basename "$0") [-b|--branch <name>] [-e|--exclude <label>]... [--profile <name>]... [-- <extra docker compose up args>]

  -b, --branch <name>    Branch ref to probe per service. Sanitised to match
                         the per-repo publish-branch.yml workflows. A service
                         whose Dockerhub tag exists at
                         \`defradigital/<svc>:<sanitised>\` runs that image;
                         otherwise falls back to \`:latest\`.
  -e, --exclude <label>  Omit a repo-backed service from the stack. Repeatable.
                         Valid labels: frontend, backend, admin, stub, reference-data.
                         Excluded services skip the Dockerhub probe and show
                         'excluded' in the summary. Useful when running that
                         service from source (IntelliJ / npm) — other services
                         reach it via host.docker.internal.
  --profile <name>       Limit the stack to services in the named profile(s).
                         Repeatable. Valid: database, infrastructure, stubs,
                         backend, frontend. Defaults to all five.
                         Strict — passing only a subset may leave \`depends_on\`
                         unmet; use this when intentionally running a
                         dependency natively (e.g. backend in IntelliJ).
  -h, --help             Show this help.

Anything after \`--\` is forwarded verbatim to \`docker compose ... up\`.

Images are pulled fresh on every run (\`--pull always\`) so stale \`:latest\`
or stale branch tags can't silently lag behind Dockerhub.

If \`docker manifest inspect\` starts failing after many invocations, run
\`docker login\` — anonymous Dockerhub manifest pulls are rate-limited.
EOF
}

parse_run_stack_flags() {
  [ "${valid_labels+x}" = x ] || {
    print_error "internal error: lib/flags.sh requires valid_labels to be defined before sourcing"
    exit 70
  }
  [ "${valid_profiles+x}" = x ] || {
    print_error "internal error: lib/flags.sh requires valid_profiles to be defined before sourcing"
    exit 70
  }

  branch=""
  extra=()
  excluded_labels=()
  selected_profiles=()

  while [ $# -gt 0 ]; do
    case "$1" in
      -b|--branch)
        [ $# -ge 2 ] || { print_error "error: --branch requires a value"; exit 2; }
        branch="$2"
        shift 2
        ;;
      --branch=*)
        branch="${1#--branch=}"
        shift
        ;;
      -e|--exclude)
        [ $# -ge 2 ] || { print_error "error: --exclude requires a value"; exit 2; }
        excluded_labels+=("$2")
        shift 2
        ;;
      --exclude=*)
        excluded_labels+=("${1#--exclude=}")
        shift
        ;;
      --profile)
        [ $# -ge 2 ] || { print_error "error: --profile requires a value"; exit 2; }
        selected_profiles+=("$2")
        shift 2
        ;;
      --profile=*)
        selected_profiles+=("${1#--profile=}")
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
        print_error "error: unexpected argument: $1"
        usage >&2
        exit 2
        ;;
    esac
  done

  if [ ${#excluded_labels[@]} -gt 0 ]; then
    local valid_csv
    valid_csv="$(IFS=,; echo "${valid_labels[*]}")"
    valid_csv="${valid_csv//,/, }"
    local label valid found
    for label in "${excluded_labels[@]}"; do
      found=0
      for valid in "${valid_labels[@]}"; do
        [ "$label" = "$valid" ] && { found=1; break; }
      done
      if [ "$found" -eq 0 ]; then
        print_error "error: unknown --exclude label '$label'; valid: $valid_csv"
        exit 2
      fi
    done
  fi

  if [ ${#selected_profiles[@]} -gt 0 ]; then
    local valid_csv profile valid found
    valid_csv="$(IFS=,; echo "${valid_profiles[*]}")"
    valid_csv="${valid_csv//,/, }"
    for profile in "${selected_profiles[@]}"; do
      found=0
      for valid in "${valid_profiles[@]}"; do
        [ "$profile" = "$valid" ] && { found=1; break; }
      done
      if [ "$found" -eq 0 ]; then
        print_error "error: unknown --profile name '$profile'; valid: $valid_csv"
        exit 2
      fi
    done
  fi
}
