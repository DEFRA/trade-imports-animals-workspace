# Sourced by scripts/stack/*.sh. Exports COLOUR_* ANSI constants for stdout
# consumers and a `print_error` helper for stderr. No shebang and no
# executable bit — this file is for sourcing, not running.
#
# Per-stream tty detection (stdout vs stderr) — a user can redirect one and
# leave the other on the terminal. CI and NO_COLOR (per no-color.org) disable
# colour outright on both streams.

_colour_base_enabled=1
[ -n "${CI:-}" ] && _colour_base_enabled=0
[ -n "${NO_COLOR:-}" ] && _colour_base_enabled=0

if [ "$_colour_base_enabled" = 1 ] && [ -t 1 ]; then COLOUR_OUT=1; else COLOUR_OUT=0; fi
if [ "$_colour_base_enabled" = 1 ] && [ -t 2 ]; then COLOUR_ERR=1; else COLOUR_ERR=0; fi
unset _colour_base_enabled

if [ "$COLOUR_OUT" = 1 ]; then
  COLOUR_RESET=$'\033[0m'
  COLOUR_RED=$'\033[31m'
  COLOUR_GREEN=$'\033[32m'
  COLOUR_YELLOW=$'\033[33m'
  COLOUR_CYAN=$'\033[36m'
  COLOUR_GREY=$'\033[90m'
  COLOUR_BOLD=$'\033[1m'
else
  COLOUR_RESET=""
  COLOUR_RED=""
  COLOUR_GREEN=""
  COLOUR_YELLOW=""
  COLOUR_CYAN=""
  COLOUR_GREY=""
  COLOUR_BOLD=""
fi

# Emit a message to stderr in red if stderr is a terminal (and colour isn't
# otherwise disabled). Used by lib/flags.sh and the stack scripts.
print_error() {
  if [ "$COLOUR_ERR" = 1 ]; then
    printf '\033[31m%s\033[0m\n' "$*" >&2
  else
    printf '%s\n' "$*" >&2
  fi
}
