#!/bin/bash
# Resolve workflow phase → recommended model (Cursor Pro + Claude Pro defaults).
#
# Usage:
#   resolve-model.sh --role plan [--host cursor|claude_code|auto] [--json]
#   resolve-model.sh --trigger "plan EUDPA-1234" [--host auto] [--json]
#   resolve-model.sh --worker review-worker [--host auto] [--json]
#
# Host auto-detection: CURSOR_* env → cursor; CLAUDECODE / CLAUDE_CODE → claude_code;
# else cursor (this workspace is usually opened in Cursor).
#
# The host UI must still be switched by the developer (/model or picker).
# Task spawns use task_slug from this output when the Task tool accepts model.

set -e

WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"
CONFIG="$WORKSPACE/docs/agent-models.json"

ROLE=""
TRIGGER=""
HOST="auto"
WORKER=0
JSON=0

usage() {
    cat <<EOF
Usage: $0 --role ROLE [--host cursor|claude_code|auto] [--json]
       $0 --trigger "plan EUDPA-1234" [--host auto] [--json]
       $0 --worker review-worker [--host auto] [--json]
EOF
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --role) ROLE="$2"; shift 2 ;;
        --trigger) TRIGGER="$2"; shift 2 ;;
        --worker) WORKER=1; ROLE="$2"; shift 2 ;;
        --host) HOST="$2"; shift 2 ;;
        --json) JSON=1; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown arg: $1" >&2; usage ;;
    esac
done

[[ -f "$CONFIG" ]] || { echo "Missing $CONFIG" >&2; exit 1; }

detect_host() {
    local h="$1"
    if [[ "$h" != "auto" ]]; then
        echo "$h"
        return
    fi
    if [[ -n "${CLAUDECODE:-}" ]] || [[ -n "${CLAUDE_CODE:-}" ]]; then
        echo "claude_code"
        return
    fi
    if [[ -n "${CURSOR_AGENT:-}" ]] || [[ -n "${CURSOR_TRACE_ID:-}" ]] \
        || [[ "${TERM_PROGRAM:-}" == "cursor" ]]; then
        echo "cursor"
        return
    fi
    echo "cursor"
}

resolve_same_as() {
    local role="$1"
    local same
    same=$(jq -r --arg r "$role" '.roles[$r].same_as // empty' "$CONFIG")
    if [[ -n "$same" ]]; then
        echo "$same"
    else
        echo "$role"
    fi
}

role_from_trigger() {
    local trigger="$1"
    local trigger_lc
    trigger_lc=$(printf '%s' "$trigger" | tr '[:upper:]' '[:lower:]')

    # Longest matching binding key wins.
    jq -r --arg t "$trigger_lc" '
        .bindings
        | to_entries
        | map(select(.key as $k | $t | startswith($k)))
        | sort_by(.key | length)
        | reverse
        | .[0].value.session_role // empty
    ' "$CONFIG"
}

if [[ -n "$TRIGGER" ]]; then
    ROLE=$(role_from_trigger "$TRIGGER")
    [[ -z "$ROLE" ]] && { echo "No binding for trigger: $TRIGGER" >&2; exit 1; }
fi

[[ -z "$ROLE" ]] && usage

HOST=$(detect_host "$HOST")
RESOLVED=$(resolve_same_as "$ROLE")

if [[ "$WORKER" == "1" ]]; then
    FIELD="task_slug"
else
    FIELD="session"
fi

# shellcheck disable=SC2016
payload=$(jq -n \
    --arg role "$ROLE" \
    --arg resolved "$RESOLVED" \
    --arg host "$HOST" \
    --argjson cfg "$(cat "$CONFIG")" \
    --arg field "$FIELD" \
    '
    ($cfg.subscription // "cursor_pro_claude_pro") as $sub |
    ($cfg.roles[$resolved] // $cfg.roles[$role]) as $r |
    ($r.hosts[$host] // {}) as $h |
    {
        subscription: $sub,
        role: $role,
        resolved_role: $resolved,
        host: $host,
        purpose: ($r.purpose // null),
        session: {
            picker_label: ($h.picker_label // null),
            session_slug: ($h.session_slug // null),
            session_hint: ($h.session_hint // null),
            model_command: ($h.model_command // null),
            model_command_complex: ($h.model_command_complex // null)
        },
        task_slug: ($h.task_slug // null)
    }
    ')

if [[ "$JSON" == "1" ]]; then
    echo "$payload"
    exit 0
fi

# Human output — first line machine-parseable for orchestrators.
echo "MODEL: $(echo "$payload" | jq -c '.')"

echo
echo "Model gate — role: $ROLE ($RESOLVED) · host: $HOST · subscription: $(echo "$payload" | jq -r '.subscription')"
echo

if [[ "$WORKER" == "1" ]]; then
    task_slug=$(echo "$payload" | jq -r '.task_slug // empty')
    if [[ -n "$task_slug" ]]; then
        echo "Task spawn: pass model=$task_slug when the Task tool supports it."
    else
        echo "Task spawn: omit model (inherit parent session)."
    fi
    exit 0
fi

case "$HOST" in
    cursor)
        picker=$(echo "$payload" | jq -r '.session.picker_label // empty')
        slug=$(echo "$payload" | jq -r '.session.session_slug // empty')
        hint=$(echo "$payload" | jq -r '.session.session_hint // empty')
        if [[ -n "$picker" ]]; then
            echo "Session: select \"$picker\" in the Cursor Agent model picker."
        elif [[ -n "$hint" ]]; then
            echo "Session: $hint"
        fi
        [[ -n "$slug" ]] && echo "  slug: $slug"
        ;;
    claude_code)
        cmd=$(echo "$payload" | jq -r '.session.model_command // empty')
        complex=$(echo "$payload" | jq -r '.session.model_command_complex // empty')
        hint=$(echo "$payload" | jq -r '.session.session_hint // empty')
        if [[ -n "$cmd" ]]; then
            echo "Session: run $cmd in this chat before continuing."
        fi
        [[ -n "$complex" ]] && echo "  Complex tickets: $complex"
        [[ -n "$hint" ]] && echo "  ($hint)"
        ;;
esac

echo
echo "Confirm the model is set, then continue the workflow."
