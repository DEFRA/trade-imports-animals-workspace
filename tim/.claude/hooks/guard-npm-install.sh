#!/usr/bin/env bash
# PreToolUse on Bash — block `npm install <unscoped-pkg>` to deter typosquatting.
# Allows: no-arg installs (refresh from lockfile), scoped packages (@scope/pkg),
# packages listed in .claude/hooks/npm-allowlist.txt.

set -euo pipefail

payload=$(cat)

tool=$(echo "$payload" | jq -r '.tool_name // empty')
[ "$tool" = "Bash" ] || exit 0

cmd=$(echo "$payload" | jq -r '.tool_input.command // empty')
[ -n "$cmd" ] || exit 0

# Skip if no npm install/i subcommand at all.
case " $cmd " in
  *' npm install '*|*' npm i '*|'npm install '*|'npm i '*) ;;
  *) exit 0 ;;
esac

# Tokenise on whitespace; find `npm` then the next token (must be `install` or `i`),
# then collect the rest, dropping flags.
# shellcheck disable=SC2206
tokens=( $cmd )

pkgs=()
i=0
n=${#tokens[@]}
while [ $i -lt $n ]; do
  if [ "${tokens[$i]}" = "npm" ] && [ $((i + 1)) -lt $n ]; then
    sub="${tokens[$((i + 1))]}"
    if [ "$sub" = "install" ] || [ "$sub" = "i" ]; then
      j=$((i + 2))
      while [ $j -lt $n ]; do
        tok="${tokens[$j]}"
        case "$tok" in
          -*) ;;
          '') ;;
          # Stop collecting at a shell separator if it slipped in.
          \;|\&\&|\|\|) break ;;
          *) pkgs+=("$tok") ;;
        esac
        j=$((j + 1))
      done
      break
    fi
  fi
  i=$((i + 1))
done

# No package args → refreshing from package.json/lockfile, allow.
[ ${#pkgs[@]} -eq 0 ] && exit 0

ALLOWLIST="$(dirname "$0")/npm-allowlist.txt"
violations=()
for pkg in "${pkgs[@]}"; do
  # Strip version suffix (@x.y.z or @latest), keep scope prefix.
  case "$pkg" in
    @*/*)
      # Scoped — keep first @scope/name, drop @version after.
      name="${pkg%@*}"
      [ "$name" = "@" ] && name="$pkg"  # safety for malformed
      ;;
    @*)
      # Bare scope without /name — malformed, treat as violation.
      name="$pkg"
      ;;
    *)
      name="${pkg%%@*}"
      ;;
  esac
  # Scoped → allow.
  case "$name" in @*/*) continue ;; esac
  # In allowlist → allow.
  if [ -f "$ALLOWLIST" ] && grep -v '^[[:space:]]*#' "$ALLOWLIST" | grep -qxF "$name"; then
    continue
  fi
  violations+=("$name")
done

if [ ${#violations[@]} -gt 0 ]; then
  joined="${violations[*]}"
  first="${violations[0]}"
  cat >&2 <<EOF
Refusing unscoped npm install for: $joined

Unscoped npm packages are vulnerable to typosquatting (workspace memory:
npx_use_scoped_names — real prior hit was \`lhci\` → typosquat).

Either:
  1. Use the scoped form: @scope/$first
  2. If this package is genuinely required and unscoped, add it to
     .claude/hooks/npm-allowlist.txt with a comment above the entry
     explaining why the unscoped form is needed.
EOF
  exit 2
fi
