#!/bin/bash
# PreToolUse guard for the Bash tool — blocks bypasses of the permission deny list
# that string-matching rules can't reliably catch.
#
# Incident that started this (2026-06-10): a denied `node scan.mjs` was re-run by
# copying the script into an allowlisted scripts/** path and chmod +x-ing it.
#
# Checks (each emits a deny + exit 0; a clean command exits 0 with no output and
# falls through to the normal allow/deny rules):
#   1. chmod in command position (any path form; behind sudo/timeout/etc; and via
#      find -exec / xargs) — adding execute bits is how a fresh file becomes runnable.
#   2. Path-invoked executables (./x, ~/x, /abs/x, dir/x) must be committed at HEAD
#      and unmodified in a git repo. Untracked/staged-only/edited/outside-a-repo
#      executables are denied — committing first forces a visible, reviewable step.
#   3. Secret-file reads by common readers (jq/grep/awk/file/cut/tr/strings/...) —
#      defence-in-depth for paths the Read() deny doesn't cover at the Bash layer.
#      (The OS sandbox is the real fix for this; this is a backstop.)
#
# Crucially, checks 1 and 2 are also applied INSIDE command substitutions
# ($(...) and backticks), which the permission rules and a naive segment split
# would miss — e.g. `echo $(./untracked.sh)`.
#
# Exemptions for check 2: node_modules (installed artifacts) and system prefixes.
# Bare commands (node, npm, git...) are left to the normal rules.
#
# stdin: PreToolUse hook JSON. Deny via hookSpecificOutput JSON, exit 0.

set -uf

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty')
[ -z "$CMD" ] && exit 0
[ -z "$CWD" ] && CWD=$PWD

deny() {
  jq -n --arg reason "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
  exit 0
}

# Secret-path globs (case-sensitive substrings / suffixes that should never be read
# by an ad-hoc reader through Bash). The sandbox denyRead is the authoritative control.
secret_path() {
  case "$1" in
    *.env|*.env.*|*/.npmrc|*/.netrc|*/.aws/*|*/.ssh/*|*/credentials|*/credentials.*|*/secrets|*/secrets.*) return 0 ;;
    *) return 1 ;;
  esac
}

# Readers that can exfiltrate file contents but are NOT recognized by Claude's
# Read() deny at the Bash layer (cat/head/tail/sed ARE recognized; these are not).
READERS=" jq grep egrep fgrep rg awk gawk file cut tr nl tac strings xxd od hexdump base64 less more cmp comm paste join column "

# Check one already-trimmed command segment (command at word 1) for checks 1-3.
check_segment() {
  local seg first abs rabs top rel cmdname arg
  seg=$(printf '%s' "$1" | tr '\t' ' ' | tr -s ' ' \
    | sed -E 's/^[ `(]*//; s/^([A-Za-z_][A-Za-z0-9_]*=[^ ]* +)*//')
  # strip relay wrappers so the real command sits at word 1
  while :; do
    case "$seg" in
      sudo\ *|command\ *|exec\ *|nohup\ *|time\ *|nice\ *|stdbuf\ *|setsid\ *) seg=${seg#* } ;;
      timeout\ *)
        seg=${seg#* }
        case "$seg" in [0-9]*\ *) seg=${seg#* } ;; esac ;;
      *) break ;;
    esac
  done
  first=$(printf '%s' "$seg" | awk '{print $1}')
  first=${first//\"/}; first=${first//\'/}
  [ -z "$first" ] && return 0
  cmdname=${first##*/}

  # 1. chmod in command position, any path form
  case "$cmdname" in
    chmod) deny "chmod is blocked by policy (write-then-execute guard). If the execute bit is genuinely needed, the user can run it themselves: ! chmod ..." ;;
  esac

  # 3. secret-file read by a non-recognized reader
  if printf '%s' "$READERS" | grep -q " $cmdname "; then
    for arg in $seg; do
      arg=${arg//\"/}; arg=${arg//\'/}
      case "$arg" in -*) continue ;; esac
      if secret_path "$arg"; then
        deny "Blocked: reading a secret/credential path ($arg) via '$cmdname'. Secrets must not be read through ad-hoc Bash readers. If genuinely needed, the user runs it themselves."
      fi
    done
  fi

  # 2. path-invoked executable must be committed-and-clean
  case "$first" in
    */*) ;;        # path invocation — inspect
    *) return 0 ;; # bare command — normal rules apply
  esac
  case "$first" in
    '~/'*)      abs="$HOME/${first#\~/}" ;;
    '$HOME/'*)  abs="$HOME/${first#\$HOME/}" ;;
    /*)         abs="$first" ;;
    *)          abs="$CWD/$first" ;;
  esac
  rabs=$(realpath "$abs" 2>/dev/null) && abs="$rabs"
  [ -f "$abs" ] || return 0
  case "$abs" in
    */node_modules/*) return 0 ;;
    /usr/*|/bin/*|/sbin/*|/opt/*|/System/*|/Library/*|/Applications/*) return 0 ;;
  esac
  top=$(git -C "$(dirname "$abs")" rev-parse --show-toplevel 2>/dev/null) \
    || deny "Blocked: '$first' is an executable outside any git repository. Executables must live committed in a repo; otherwise ask the user to run it."
  rel=${abs#"$top"/}
  git -C "$top" cat-file -e "HEAD:$rel" 2>/dev/null \
    || deny "Blocked: '$rel' is not committed in $top. New executables must be committed (a visible, reviewable step) before they can run."
  git -C "$top" diff --quiet HEAD -- "$rel" 2>/dev/null \
    || deny "Blocked: '$rel' differs from HEAD in $top. Commit the change before executing it."
}

# --- chmod via launcher indirection (find -exec chmod, xargs chmod), whole string -
if printf '%s' "$CMD" | grep -Eq -- '-(exec|execdir|ok|okdir)[[:space:]]+[^[:space:]]*chmod|xargs([[:space:]]+-[^[:space:]]+)*[[:space:]]+[^[:space:]]*chmod'; then
  deny "chmod (via find -exec / xargs) is blocked by policy (write-then-execute guard). If genuinely needed, the user runs it: ! chmod ..."
fi

# --- pull out command-substitution bodies: $( ... ) and ` ... ` -----------------
# These are executed as commands but are invisible to a naive operator split, so
# they must go through the same per-segment checks. One level of nesting is enough
# for the patterns we care about.
SUBS=$(printf '%s' "$CMD" \
  | grep -oE '\$\([^()]*\)|`[^`]*`' \
  | sed -E 's/^\$\(//; s/\)$//; s/^`//; s/`$//')

# --- run checks over top-level segments + any command-sub bodies ----------------
ALL=$(printf '%s\n%s' "$CMD" "$SUBS")
IFS=$'\n'
for line in $ALL; do
  [ -z "$line" ] && continue
  for seg in $(printf '%s' "$line" | tr '|;&\n' '\n'); do
    [ -z "$seg" ] && continue
    check_segment "$seg"
  done
done

exit 0
