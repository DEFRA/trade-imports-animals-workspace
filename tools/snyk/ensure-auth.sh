#!/bin/bash
# Verify Snyk CLI is installed and authenticated.
# Usage: ensure-auth.sh [--json]
# Exit 0 when ready; exit 1 with message otherwise.

set -e

JSON=0
[[ "${1:-}" == "--json" ]] && JSON=1

if ! command -v snyk >/dev/null 2>&1; then
    msg="Snyk CLI not found — install: brew install snyk/tap/snyk"
    if [[ "$JSON" == "1" ]]; then
        jq -n --arg err "$msg" '{ok: false, error: $err}'
    else
        echo "$msg" >&2
    fi
    exit 1
fi

version=$(snyk --version 2>/dev/null | head -1)

if [[ -n "${SNYK_TOKEN:-}" ]]; then
    if [[ "$JSON" == "1" ]]; then
        jq -n --arg v "$version" '{ok: true, method: "SNYK_TOKEN", version: $v}'
    else
        echo "Snyk OK (SNYK_TOKEN) — $version"
    fi
    exit 0
fi

if snyk config get api >/dev/null 2>&1; then
    if [[ "$JSON" == "1" ]]; then
        jq -n --arg v "$version" '{ok: true, method: "snyk auth", version: $v}'
    else
        echo "Snyk OK (snyk auth) — $version"
    fi
    exit 0
fi

msg="Snyk not authenticated — run: snyk auth   (or export SNYK_TOKEN)"
if [[ "$JSON" == "1" ]]; then
    jq -n --arg v "$version" --arg err "$msg" '{ok: false, version: $v, error: $err}'
else
    echo "$msg" >&2
fi
exit 1
