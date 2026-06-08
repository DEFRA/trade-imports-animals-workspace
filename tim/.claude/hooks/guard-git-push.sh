#!/usr/bin/env bash
# PreToolUse on Bash — block pushes to main and force-pushes.

set -euo pipefail

payload=$(cat)

tool=$(echo "$payload" | jq -r '.tool_name // empty')
[ "$tool" = "Bash" ] || exit 0

cmd=$(echo "$payload" | jq -r '.tool_input.command // empty')

# Only consider `git push` commands.
case " $cmd " in
  *' git push '*|'git push '*) ;;
  *) exit 0 ;;
esac

# Tokenise and inspect.
# shellcheck disable=SC2206
tokens=( $cmd )

for tok in "${tokens[@]}"; do
  case "$tok" in
    -f|--force|--force-with-lease|--force-with-lease=*|-f=*)
      cat >&2 <<'EOF'
Refusing force push.

Force pushes rewrite history and can clobber teammates' work or break PRs.
If you genuinely need to rewrite a feature branch (e.g. after a rebase),
run the command yourself — this guard is here so the agent never does it.
EOF
      exit 2
      ;;
  esac
done

# Block pushes that target main.
if echo " $cmd " | grep -Eq '[[:space:]]+main([[:space:]]|$)' \
   || echo " $cmd " | grep -Eq '[[:space:]]HEAD:main([[:space:]]|$)'; then
  cat >&2 <<'EOF'
Refusing push to main.

Land changes via PR:
  git checkout -b feat/EUDPA-XXXX-tim-<slug>
  git push -u origin feat/EUDPA-XXXX-tim-<slug>
  # open PR against main in DEFRA/trade-imports-animals
EOF
  exit 2
fi
