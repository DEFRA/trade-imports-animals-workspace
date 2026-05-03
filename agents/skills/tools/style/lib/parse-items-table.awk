#!/usr/bin/awk -f
# Parse the `## Items` table from a style-review.{repo}.md file.
#
# Reads from stdin or file argument. Outputs TSV with one row per item:
#   id\tfile\tline\trule\tseverity\tissue\tfix\tdisposition\tstatus\tnotes
#
# Cell content with literal `|` must be escaped as `\|` in the markdown table.
# This parser unescapes them in the output.

BEGIN {
    in_items = 0
    seen_separator = 0
    OFS = "\t"
    PIPE_TOKEN = "<<<PIPE>>>"
}

# Section boundary detection
/^## / {
    if ($0 ~ /^## Items[[:space:]]*$/) {
        in_items = 1
        seen_separator = 0
        next
    } else if (in_items) {
        in_items = 0
    }
    next
}

!in_items { next }

# Detect table separator line: |---|---|...
/^\|[[:space:]]*-+/ {
    seen_separator = 1
    next
}

# Header row (before separator) — skip
!seen_separator && /^\|/ { next }

# Data rows
seen_separator && /^\|/ {
    line = $0
    gsub(/\\\|/, PIPE_TOKEN, line)
    n = split(line, parts, /\|/)
    # parts[1] empty (before first |), parts[n] empty (after last |)
    # Expect 12 parts for 10 data columns

    if (n < 12) next

    for (i = 2; i <= 11; i++) {
        cell = parts[i]
        sub(/^[ \t]+/, "", cell)
        sub(/[ \t]+$/, "", cell)
        gsub(PIPE_TOKEN, "|", cell)
        parts[i] = cell
    }

    # Strip leading # from id
    id = parts[2]
    sub(/^#/, "", id)

    print id, parts[3], parts[4], parts[5], parts[6], parts[7], parts[8], parts[9], parts[10], parts[11]
}

# A blank line or non-table line ends the table
/^[[:space:]]*$/ && seen_separator {
    in_items = 0
}
