#!/bin/bash
# Pre-fetch present-info context for the ticket-creator skill:
#   - active epics on the EUDPA board (default board 13780)
#   - capability codes from the EUDP Import Notification Capability Map
#     (default Confluence page 6468764101)
#
# Outputs live under workareas/ticket-creation/.prereqs/. The skill
# Reads them at session start so the interview can offer concrete
# pickers ("which epic?" / "which capability?") backed by fresh data.
#
# Usage: ./prepare-ticket-creation.sh [--board BOARD_ID] [--cap-page PAGE_ID]
#
# Environment:
#   JIRA_USER, JIRA_TOKEN, JIRA_BASE_URL  (Atlassian credentials)

set -euo pipefail

WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"
BOARD_ID="13780"
CAP_PAGE_ID="6468764101"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --board)
            BOARD_ID="$2"; shift 2
            ;;
        --cap-page)
            CAP_PAGE_ID="$2"; shift 2
            ;;
        -h|--help)
            sed -n '2,16p' "$0"; exit 0
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

OUTPUT_DIR="$WORKSPACE/workareas/ticket-creation/.prereqs"
SYNCED_MD="$WORKSPACE/docs/confluence/import-notification-capability-map.md"

mkdir -p "$OUTPUT_DIR"

# ── 1. Active epics from the board ─────────────────────────────────────────────

EPICS_FILE="$OUTPUT_DIR/epics.txt"
"$WORKSPACE/tools/jira/list-board-epics.sh" "$BOARD_ID" > "$EPICS_FILE"
EPIC_COUNT=$(wc -l < "$EPICS_FILE" | tr -d ' ')

# ── 2. Capability codes from the synced capability map ────────────────────────

CAPS_FILE="$OUTPUT_DIR/capabilities.txt"
: > "$CAPS_FILE"
STALE_WARNING=""

if [[ ! -f "$SYNCED_MD" ]]; then
    STALE_WARNING="No synced capability map found at $SYNCED_MD — run tools/confluence/sync-docs.sh to populate docs/confluence/."
else
    # Compare Confluence live version against the synced frontmatter
    LIVE_VERSION=$("$WORKSPACE/tools/confluence/page.sh" "$CAP_PAGE_ID" summary 2>/dev/null | jq -r '.version // empty' || true)
    SYNCED_VERSION=$(grep -m1 '^version:' "$SYNCED_MD" | awk '{print $2}' || true)

    if [[ -n "$LIVE_VERSION" && -n "$SYNCED_VERSION" && "$LIVE_VERSION" != "$SYNCED_VERSION" ]]; then
        STALE_WARNING="Synced capability map is at version $SYNCED_VERSION; live page is at version $LIVE_VERSION. Re-run tools/confluence/sync-docs.sh to refresh."
    fi

    perl -ne '
        if (/^\| ((?:CORE-)?CAP-[A-Z0-9.]+) \| \*\*([^*]+?)\*\*/) {
            print "$1 — $2\n";
        }
    ' "$SYNCED_MD" | sort -u > "$CAPS_FILE"
fi

CAP_COUNT=$(wc -l < "$CAPS_FILE" | tr -d ' ')

# ── 3. Meta ────────────────────────────────────────────────────────────────────

jq -n \
    --arg board "$BOARD_ID" \
    --arg cap_page "$CAP_PAGE_ID" \
    --arg generated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --argjson epic_count "$EPIC_COUNT" \
    --argjson cap_count "$CAP_COUNT" \
    --arg stale_warning "$STALE_WARNING" \
    '{board, cap_page, generated, epic_count, cap_count, stale_warning}' \
    > "$OUTPUT_DIR/meta.json"

# ── 4. Summary ─────────────────────────────────────────────────────────────────

echo "Prepared ticket-creation prereqs at $OUTPUT_DIR/"
echo "  - epics.txt          ($EPIC_COUNT active epics from board $BOARD_ID)"
echo "  - capabilities.txt   ($CAP_COUNT capability codes from page $CAP_PAGE_ID)"
echo "  - meta.json"
if [[ -n "$STALE_WARNING" ]]; then
    echo
    echo "  WARNING: $STALE_WARNING"
fi
