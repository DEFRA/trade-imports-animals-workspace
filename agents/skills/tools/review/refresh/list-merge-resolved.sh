#!/bin/bash
# Enumerate hand-resolved merge conflict files in a single repo's refresh window.
# Usage:
#   list-merge-resolved.sh REPO_DIR PRIOR_SHA HEAD_SHA [--tsv|--json]
#
# A merge commit's `# Conflicts:` block lists files that had conflicts. We treat each
# such file as merge-resolved unless the resolution is trivially equal to the prior
# reviewed state (`git diff PRIOR..HEAD -- file` is empty).
#
# Output (TSV by default):
#   merge_sha\tfile_path
#
# JSON: array of { "merge": sha, "file": path }

set -e

OUTPUT_FORMAT="tsv"
REPO_DIR=""
PRIOR_SHA=""
HEAD_SHA=""

usage() {
    echo "Usage: $0 REPO_DIR PRIOR_SHA HEAD_SHA [--tsv|--json]" >&2
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --tsv)  OUTPUT_FORMAT="tsv"; shift ;;
        --json) OUTPUT_FORMAT="json"; shift ;;
        -h|--help) usage ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *)
            if   [[ -z "$REPO_DIR"  ]]; then REPO_DIR="$1"
            elif [[ -z "$PRIOR_SHA" ]]; then PRIOR_SHA="$1"
            elif [[ -z "$HEAD_SHA"  ]]; then HEAD_SHA="$1"
            fi
            shift
            ;;
    esac
done

[[ -z "$REPO_DIR" || -z "$PRIOR_SHA" || -z "$HEAD_SHA" ]] && usage
[[ -d "$REPO_DIR/.git" ]] || { echo "Not a git repo: $REPO_DIR" >&2; exit 1; }

# Collect (merge_sha, file) pairs from `# Conflicts:` blocks of merge commits
# in PRIOR..HEAD.
candidates=$(
    git -C "$REPO_DIR" log --merges --format='%H' "$PRIOR_SHA..$HEAD_SHA" |
    while read -r sha; do
        git -C "$REPO_DIR" log --format='%B' -1 "$sha" |
            awk -v s="$sha" '
                /^# Conflicts:/ { p = 1; next }
                p && /^#\t/      { sub(/^#\t/, ""); print s "\t" $0; next }
                p && !/^#/       { p = 0 }
            '
    done
)

# Apply trivial-resolution filter: skip files whose PRIOR..HEAD diff is empty.
filtered=""
while IFS=$'\t' read -r sha file; do
    [[ -z "$sha" ]] && continue
    if git -C "$REPO_DIR" diff --quiet "$PRIOR_SHA..$HEAD_SHA" -- "$file" 2>/dev/null; then
        continue
    fi
    filtered="${filtered}${sha}\t${file}\n"
done <<<"$candidates"

if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    if [[ -z "$filtered" ]]; then
        echo "[]"
    else
        printf '%b' "$filtered" | jq -Rn '
            [inputs | select(length > 0) | split("\t") | {merge: .[0], file: .[1]}]
        '
    fi
else
    if [[ -n "$filtered" ]]; then
        printf '%b' "$filtered"
    fi
fi
