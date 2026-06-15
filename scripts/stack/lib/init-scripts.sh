# Stages repo-owned init scripts into docker/stack/.staged/ so the compose
# files can mount one stable path whether or not repos/ is cloned.
#
# Ownership (EUDPA-178): the backend repo owns the localstack provisioning
# script, the tests repo owns the mongo seed fixtures, the dynamics-gateway
# repo owns the Azure Service Bus emulator config, and the workspace owns the
# mongo replica-set init. Locally the scripts come from repos/<repo>/;
# in CI (where only the workspace repo is checked out) they are sparse-fetched
# from GitHub — the requested branch first, the default branch as fallback.
#
# Requires: STACK_DIR, WORKSPACE_ROOT, print_error (lib/colour.sh)
[ -n "${STACK_DIR:-}" ] || {
  print_error "internal error: lib/init-scripts.sh requires STACK_DIR to be set"
  exit 70
}

REPOS_DIR="$WORKSPACE_ROOT/repos"
STAGED_DIR="$STACK_DIR/.staged"

# fetch_repo_path <repo> <ref> <repo-path> <dest-dir>
# Sparse-fetches <repo-path> from github.com/DEFRA/<repo> into <dest-dir>,
# trying <ref> first and falling back to the default branch.
fetch_repo_path() {
  local repo="$1" ref="$2" path="$3" dest="$4"
  local url="https://github.com/DEFRA/${repo}.git"
  local tmp
  tmp="$(mktemp -d)"
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'" RETURN

  if [ -z "$ref" ] || ! git clone --quiet --depth 1 --filter=blob:none --sparse \
        --branch "$ref" "$url" "$tmp/clone" 2>/dev/null; then
    git clone --quiet --depth 1 --filter=blob:none --sparse "$url" "$tmp/clone" || {
      print_error "error: cannot clone $url — offline? Run 'make setup' to clone repos/ instead."
      return 1
    }
  fi
  git -C "$tmp/clone" sparse-checkout set --no-cone "/$path" >/dev/null

  if [ ! -e "$tmp/clone/$path" ]; then
    print_error "error: $repo: path '$path' not found on ${ref:-the default branch} or the default branch"
    return 1
  fi

  if [ -d "$tmp/clone/$path" ]; then
    cp -R "$tmp/clone/$path/." "$dest/"
  else
    cp "$tmp/clone/$path" "$dest/"
  fi
}

# stage_source <repo> <ref> <repo-path> <dest-dir>
# Copies repos/<repo>/<repo-path> when present, sparse-fetches otherwise.
# A clone that exists but lacks <repo-path> (stale checkout) also falls
# through to the fetch — the path test is on the file, not the clone.
stage_source() {
  local repo="$1" ref="$2" path="$3" dest="$4"
  if [ -e "$REPOS_DIR/$repo/$path" ]; then
    if [ -d "$REPOS_DIR/$repo/$path" ]; then
      cp -R "$REPOS_DIR/$repo/$path/." "$dest/"
    else
      cp "$REPOS_DIR/$repo/$path" "$dest/"
    fi
  else
    printf 'Fetching %s/%s from GitHub (not present under repos/)\n' "$repo" "$path"
    fetch_repo_path "$repo" "$ref" "$path" "$dest"
  fi
}

# stage_init_scripts [<branch-ref>]
# Rebuilds docker/stack/.staged/ from the owning repos. The mongodb dir is
# flat because the mongo image only executes top-level files in
# /docker-entrypoint-initdb.d; numeric prefixes set execution order.
stage_init_scripts() {
  local ref="${1:-}"
  rm -rf "$STAGED_DIR"
  mkdir -p "$STAGED_DIR/mongodb" "$STAGED_DIR/localstack" "$STAGED_DIR/servicebus"

  # Workspace-owned: mongo replica-set init
  cp "$STACK_DIR/scripts/mongodb/10-database-setup.js" "$STAGED_DIR/mongodb/"

  # Tests-repo-owned: mongo notification seed fixtures
  stage_source trade-imports-animals-tests "$ref" seeds/mongodb "$STAGED_DIR/mongodb"

  # Backend-owned: localstack resource provisioning
  stage_source trade-imports-animals-backend "$ref" compose/start-localstack.sh "$STAGED_DIR/localstack"

  # Dynamics-gateway-owned: Azure Service Bus emulator entity config
  stage_source trade-imports-dynamics-gateway "$ref" servicebus/servicebus-config.json "$STAGED_DIR/servicebus"
}
