#!/bin/bash
# PreToolUse guard for the Bash tool — blocks write-then-execute bypasses of the
# permission deny list (incident 2026-06-10: a denied `node scan.mjs` was re-run
# by copying the script into the allowlisted scripts/** path and chmod +x-ing it).
#
# Two checks:
#   1. chmod in command position (any path form, incl. behind sudo/timeout/etc.
#      wrappers and find -exec / xargs indirection) — adding execute bits is how
#      a freshly written file becomes runnable. Denied outright; the user can
#      run it themselves with `! chmod ...` when genuinely needed.
#   2. Path-invoked executables (./x, ~/x, /abs/x, dir/x) must be committed at
#      HEAD and unmodified in a git repo. Untracked, staged-only, edited or
#      outside-any-repo executables are denied — committing first forces the
#      change through a visible, reviewable step.
#
# Exemptions for check 2: node_modules (installed artifacts, never tracked) and
# system/toolchain prefixes. Bare commands (node, npm, git...) are left to the
# normal allow/deny rules — this hook only closes the path-invocation hole.
#
# Invoked by Claude Code as: bash "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-bash.sh"
# stdin: hook JSON; a deny is emitted as hookSpecificOutput JSON with exit 0.

set -uf

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty')
[ -z "$CMD" ] && exit 0

deny() {
  jq -n --arg reason "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
  exit 0
}

# --- 1. chmod via launcher indirection (find -exec chmod, xargs chmod) ---------
# Plain `chmod ...` is caught in command position inside the segment loop below;
# matching "chmod" anywhere in the string false-positives on commit messages etc.
if printf '%s' "$CMD" | grep -Eq -- '-(exec|execdir|ok|okdir)[[:space:]]+[^[:space:]]*chmod|xargs([[:space:]]+-[^[:space:]]+)*[[:space:]]+[^[:space:]]*chmod'; then
  deny "chmod (via find -exec / xargs) is blocked by policy (write-then-execute guard). If the execute bit is genuinely needed, the user can run it themselves: ! chmod ..."
fi

# --- 2. per-segment command-position checks ------------------------------------
IFS=$'\n'
for seg in $(printf '%s' "$CMD" | tr '|;&' '\n'); do
  # normalise whitespace, trim grouping chars, drop VAR=value prefixes
  seg=$(printf '%s' "$seg" | tr '\t' ' ' | tr -s ' ' \
    | sed -E 's/^[ `(]*//; s/^([A-Za-z_][A-Za-z0-9_]*=[^ ]* +)*//')
  # strip relay wrappers so the real command sits at word 1
  while :; do
    case "$seg" in
      sudo\ *|command\ *|exec\ *|nohup\ *|time\ *|nice\ *) seg=${seg#* } ;;
      timeout\ *)
        seg=${seg#* }
        case "$seg" in [0-9]*\ *) seg=${seg#* } ;; esac ;;
      *) break ;;
    esac
  done
  first=$(printf '%s' "$seg" | awk '{print $1}')
  first=${first//\"/}; first=${first//\'/}
  [ -z "$first" ] && continue

  # chmod in command position, in any path form (chmod, /bin/chmod, ./chmod)
  case "${first##*/}" in
    chmod) deny "chmod is blocked by policy (write-then-execute guard). If the execute bit is genuinely needed, the user can run it themselves: ! chmod ..." ;;
  esac
  case "$first" in
    */*) ;;          # path invocation — inspect
    *) continue ;;   # bare command — normal permission rules apply
  esac
  case "$first" in
    '~/'*)      abs="$HOME/${first#\~/}" ;;
    '$HOME/'*)  abs="$HOME/${first#\$HOME/}" ;;
    /*)         abs="$first" ;;
    *)          abs="$CWD/$first" ;;
  esac
  rabs=$(realpath "$abs" 2>/dev/null) && abs="$rabs"
  [ -f "$abs" ] || continue
  case "$abs" in
    */node_modules/*) continue ;;
    /usr/*|/bin/*|/sbin/*|/opt/*|/System/*|/Library/*|/Applications/*) continue ;;
  esac
  top=$(git -C "$(dirname "$abs")" rev-parse --show-toplevel 2>/dev/null) \
    || deny "Blocked: '$first' is an executable outside any git repository. Executables must live committed in a repo; otherwise ask the user to run it."
  rel=${abs#"$top"/}
  git -C "$top" cat-file -e "HEAD:$rel" 2>/dev/null \
    || deny "Blocked: '$rel' is not committed in $top. New executables must be committed (a visible, reviewable step) before they can run."
  git -C "$top" diff --quiet HEAD -- "$rel" 2>/dev/null \
    || deny "Blocked: '$rel' differs from HEAD in $top. Commit the change before executing it."
done

exit 0
