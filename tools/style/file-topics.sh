#!/bin/bash
# file-topics.sh — map a file path to its additive best-practices topic list.
#
# PURE function of the PATH STRING: no filesystem access, deterministic, so it
# is trivially testable. Both discovery (prepare-style.sh) and the rules baker
# (bake-rules-bundle.sh) — via prepare-style.sh — call it as the single source
# of truth for the file-type -> topic mapping WITHIN the pipeline.
#
# This mirrors the same extension/path mapping that EUDPA-275 hand-aligned into
# .claude/rules/. The two copies are intentionally separate: the .claude/rules/
# path-scoped injection and this pipeline router are different mechanisms and do
# not share files.
#
# Usage:   file-topics.sh <path>
# Output:  zero or more topic names, one per line, in canonical order:
#            java  node  gds  playwright  k6
#          Prints nothing (exit 0) when the path maps to no topic.
#
# ADDITIVE: a single path can map to multiple topics.
#   - A Playwright spec (which may be .ts) additively gets `node` too, because
#     specs are JS/TS source and the node style rules apply.
#   - A k6 script named *.k6.js additively gets `node` too (it is JavaScript).

set -uo pipefail

path="${1:-}"
if [[ -z "$path" ]]; then
    echo "Usage: $0 <path>" >&2
    exit 1
fi

java=false; node=false; gds=false; playwright=false; k6=false

# java: *.java
case "$path" in
    *.java) java=true ;;
esac

# node: *.js *.mjs *.cjs *.jsx
case "$path" in
    *.js|*.mjs|*.cjs|*.jsx) node=true ;;
esac

# gds: *.njk
case "$path" in
    *.njk) gds=true ;;
esac

# playwright: *.spec.ts *.spec.js *.visual.spec.ts  (additive: also node,
# so .ts specs still pick up the node bundle)
case "$path" in
    *.spec.ts|*.spec.js|*.visual.spec.ts) playwright=true; node=true ;;
esac

# k6: **/k6/**  *.k6.js  **/perf/**/*.js   (additive: node still matches *.js)
case "$path" in
    */k6/*|*.k6.js|*/perf/*.js) k6=true ;;
esac

# Emit in canonical order.
if [[ "$java" == true ]]; then echo java; fi
if [[ "$node" == true ]]; then echo node; fi
if [[ "$gds" == true ]]; then echo gds; fi
if [[ "$playwright" == true ]]; then echo playwright; fi
if [[ "$k6" == true ]]; then echo k6; fi
exit 0
