#!/bin/bash
# Summary counts for style items in a ticket workspace.
# Usage:
#   style-counts.sh EUDPA-XXXXX [--repo REPO] [--json]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TICKET=""
REPO=""
JSON_OUTPUT=false

usage() {
    echo "Usage: $0 EUDPA-XXXXX [--repo REPO] [--json]" >&2
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --repo) REPO="$2"; shift 2 ;;
        --json) JSON_OUTPUT=true; shift ;;
        -h|--help) usage ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *) TICKET="$1"; shift ;;
    esac
done

[[ -z "$TICKET" ]] && usage

ITEMS_ARGS=( "$TICKET" )
[[ -n "$REPO" ]] && ITEMS_ARGS+=( --repo "$REPO" )

items_tsv=$("$SCRIPT_DIR/style-items.sh" "${ITEMS_ARGS[@]}")

counts=$(printf '%s\n' "$items_tsv" | awk -F'\t' '
    NF == 0 { next }
    {
        disp = ($9 == "" ? "Pending" : $9)
        stat = $10
        key = disp "\t" stat
        c[key]++
        total++
    }
    END {
        for (k in c) print c[k] "\t" k
        print "TOTAL\t" total "\t"
    }
')

if [[ "$JSON_OUTPUT" == "true" ]]; then
    printf '%s\n' "$counts" | jq -Rn '
        [inputs | split("\t")] as $rows
        | reduce $rows[] as $r ({};
            if $r[0] == "TOTAL" then .total = ($r[1] | tonumber)
            else
                .breakdown += [{ disposition: $r[1], status: $r[2], count: ($r[0] | tonumber) }]
            end
        )'
else
    printf '%s\n' "Counts for $TICKET${REPO:+ (repo: $REPO)}:"
    total=$(printf '%s\n' "$counts" | awk -F'\t' '$1=="TOTAL"{print $2}')
    printf '%s\n' "$counts" \
        | awk -F'\t' '$1!="TOTAL"' \
        | sort -t$'\t' -k2,2 -k3,3 \
        | awk -F'\t' '{
            disp = $2
            stat = ($3 == "" ? "—" : $3)
            printf "  %4d  %-15s  %s\n", $1, disp, stat
        }'
    printf '  ----\n  %4d  TOTAL\n' "$total"
fi
