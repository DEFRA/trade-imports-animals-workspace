#!/bin/bash
# Render decisions.json as a markdown view.
#
# Usage:
#   render-interview.sh --run-id <name>
#
# Used by INTERVIEWER for the mid-interview recap and by
# scaffold-skill.sh for the decisions.md sidecar.

set -e

RUN_ID=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        -h|--help)
            sed -n '2,9p' "$0" >&2
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

target="$HOME/git/defra/trade-imports-animals-workspace/workareas/skill-creator/$RUN_ID/decisions.json"
[[ -f "$target" ]] || { echo "No decisions.json at $target" >&2; exit 1; }

name=$(jq -r '.name' "$target")
purpose=$(jq -r '.answers.purpose // "(not answered)"' "$target")
state_shape=$(jq -r '.answers.state_shape // "(not answered)"' "$target")
dispatcher=$(jq -r '.answers.dispatcher // "(not answered)"' "$target")
prebake=$(jq -r '.answers.prebake // "(not answered)"' "$target")
fanout_enabled=$(jq -r '.answers.fanout.enabled // "(not answered)"' "$target")
fanout_workers=$(jq -r '.answers.fanout.workers // [] | join(", ")' "$target")
walker=$(jq -r '.answers.walker // "(not answered)"' "$target")
helpers=$(jq -r '.answers.helpers // [] | map("- " + .) | join("\n")' "$target")
[[ -z "$helpers" ]] && helpers="(not answered)"
triggers=$(jq -r '.answers.triggers.phrases // [] | map("- \"" + . + "\"") | join("\n")' "$target")
[[ -z "$triggers" ]] && triggers="(not answered)"
disambig=$(jq -r '.answers.triggers.disambiguation // "(not answered)"' "$target")

cat <<EOF
# $name skill — decisions

Recorded during CREATE interview. Update if a shape choice
changes; do not delete entries.

## 1. Purpose

$purpose

## 2. State shape

**Choice:** $state_shape
**Pattern reference:** docs/best-practices/skills/patterns.md §1

## 3. Dispatcher

**Choice:** $dispatcher
**Pattern reference:** patterns.md §2

## 4. Pre-baked context

**Choice:** $prebake
**Pattern reference:** patterns.md §3

## 5. Worker fan-out

**Choice:** $fanout_enabled
**Workers:** $fanout_workers
**Pattern reference:** patterns.md §5

## 6. Walker

**Choice:** $walker
**Pattern reference:** patterns.md §7

## 7. Helpers introduced

$helpers

## 8. Triggers

$triggers

**Disambiguation:** $disambig
EOF
