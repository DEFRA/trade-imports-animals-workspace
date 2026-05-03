#!/usr/bin/awk -f
# Parse a legacy code-style-review.md and emit TSV rows to stdout, one per
# todo-list item, partitioned by repo via the leading column.
#
# Output columns (TSV):
#   repo \t id \t file \t line \t rule \t severity \t issue \t fix \t disposition \t status \t notes
#
# Legacy doc structure:
#   ## Todo List
#       ### trade-imports-animals-frontend
#           | # | File | Rule | Issue | Addressed | Won't Address |
#           | --- | --- | --- | --- | --- | --- |
#           | 1 | ... | 2 | ... | [x] | [ ] |
#           ...
#       ### trade-imports-animals-admin
#           ...
#   ## Refresh Summary (...)
#       ...
#
# Mapping:
#   [x] Addressed       → Disposition=Fix,        Status=Done
#   [x] Won't Address   → Disposition=Won't Fix,  Status=—
#   both [ ]            → Disposition=blank,      Status=blank

BEGIN {
    OFS = "\t"
    in_todo_section = 0
    repo = ""
    seen_separator = 0
    PIPE_TOKEN = "<<<PIPE>>>"
}

# Top-level section heading
/^## / {
    if ($0 ~ /^## Todo List[[:space:]]*$/) {
        in_todo_section = 1
        repo = ""
        seen_separator = 0
    } else {
        in_todo_section = 0
        repo = ""
        seen_separator = 0
    }
    next
}

!in_todo_section { next }

# Repo subsection inside ## Todo List
/^### / {
    line = $0
    sub(/^### [[:space:]]*/, "", line)
    sub(/[[:space:]]+$/, "", line)
    if (line ~ /^trade-imports-animals-/) {
        repo = line
        seen_separator = 0
    } else {
        repo = ""
        seen_separator = 0
    }
    next
}

repo == "" { next }

# Separator row (signals start of data rows)
/^\|[[:space:]]*-+/ {
    seen_separator = 1
    next
}

# Header row before separator — skip
!seen_separator && /^\|/ { next }

# Blank line ends the table for this repo (but we stay in_todo_section
# until next ### or ## arrives).
seen_separator && /^[[:space:]]*$/ {
    seen_separator = 0
    next
}

# Data row
seen_separator && /^\|/ {
    src = $0
    gsub(/\\\|/, PIPE_TOKEN, src)
    n = split(src, parts, /\|/)
    # Expect 8 parts for 6 data columns (leading + trailing empties)
    if (n < 8) next

    for (i = 2; i <= n - 1; i++) {
        cell = parts[i]
        sub(/^[ \t]+/, "", cell)
        sub(/[ \t]+$/, "", cell)
        gsub(PIPE_TOKEN, "|", cell)
        parts[i] = cell
    }

    id = parts[2]
    sub(/^#/, "", id)
    file = parts[3]
    rule = parts[4]
    issue = parts[5]
    addressed = parts[6]
    wont = parts[7]

    # Strip surrounding backticks on file path
    sub(/^`/, "", file)
    sub(/`$/, "", file)

    # Disposition + Status from checkboxes.
    # Both checked is invalid; prefer Won't Address.
    if (wont ~ /\[x\]/) {
        disp = "Won't Fix"
        stat = "—"
    } else if (addressed ~ /\[x\]/) {
        disp = "Fix"
        stat = "Done"
    } else {
        disp = ""
        stat = ""
    }

    # Extract Line from "(line N)" / "(line N-M)" / "(lines N, M)" in issue.
    # Capture the leading numeric run; ranges/lists are simplified to the first
    # number for the column (the full text remains in Issue).
    line_num = ""
    if (match(issue, /\(line[s]?[[:space:]]+[0-9]+/)) {
        chunk = substr(issue, RSTART, RLENGTH)
        if (match(chunk, /[0-9]+/)) {
            line_num = substr(chunk, RSTART, RLENGTH)
        }
    }

    # Extract trailing Notes from " — <date|marker>" tail.
    notes = ""
    issue_clean = issue
    {
        last_pos = 0
        scan = issue_clean
        offset = 0
        while ((p = index(scan, " — ")) > 0) {
            last_pos = offset + p
            scan = substr(scan, p + length(" — "))
            offset += p + length(" — ") - 1
        }
        if (last_pos > 0) {
            tail = substr(issue_clean, last_pos + length(" — "))
            head = substr(issue_clean, 1, last_pos - 1)
            sub(/^[[:space:]]+/, "", tail)
            sub(/[[:space:]]+$/, "", tail)
            if (tail ~ /^[12][0-9]{3}-[0-9]{2}-[0-9]{2}/ \
                || tail ~ /^new finding/ \
                || tail ~ /^\*\*REGRESSED/ \
                || tail ~ /^REGRESSED/) {
                notes = tail
                issue_clean = head
                sub(/[[:space:]]+$/, "", issue_clean)
            }
        }
    }

    severity = ""
    fix = ""

    print repo, id, file, line_num, rule, severity, issue_clean, fix, disp, stat, notes
}
