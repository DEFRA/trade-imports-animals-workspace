#!/usr/bin/awk -f
# Rewrite a `## Todo List` section into the new `## Items` schema.
#
# Required:
#   -v DECISIONS_FILE=path   File containing legacy decisions (pipe-delimited rows)
#
# Decisions row format:
#   STATUS | #ID | repo | file | line | issue | notes/fix
# Status: DONE, WONT_FIX, AUTO_RESOLVED, FIX, FAILED, SKIP
#
# Old todo list columns (9): # | File | Line | Severity | Category | Issue | Fix | Fixed | Won't Fix
# New items table columns (10): # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes
#
# Strategy: ID alone is unreliable (existing EUDPA-35 data has IDs that drifted between
# the review file and decisions file across refresh runs). To migrate safely, we use the
# review file's `[x]` flags as the primary source of truth for disposition, then refine
# with the decisions row only if its file basename matches the review row's file basename.

BEGIN {
    PIPE_TOKEN = "<<<PIPE>>>"

    if (DECISIONS_FILE) {
        while ((getline dline < DECISIONS_FILE) > 0) {
            if (dline !~ /^[A-Z][A-Z_]+ \| #[0-9]+ \|/) continue
            n = split(dline, dp, /\|/)
            if (n < 7) continue
            d_status = trim(dp[1])
            d_id = dp[2]; gsub(/^[ \t#]+|[ \t]+$/, "", d_id)
            d_file = trim(dp[4])
            d_notes = dp[7]
            for (i = 8; i <= n; i++) d_notes = d_notes "|" dp[i]
            d_notes = trim(d_notes)
            if (d_notes == "—" || d_notes == "-") d_notes = ""

            decisions_status[d_id] = d_status
            decisions_notes[d_id]  = d_notes
            decisions_file[d_id]   = d_file
        }
        close(DECISIONS_FILE)
    }

    in_todo = 0
    seen_separator = 0
    written_new_header = 0
}

function trim(s) {
    sub(/^[ \t]+/, "", s)
    sub(/[ \t]+$/, "", s)
    return s
}

function strip_backticks(s) {
    sub(/^`/, "", s)
    sub(/`$/, "", s)
    return s
}

function basename(p) {
    sub(/.*\//, "", p)
    return p
}

function escape_for_table(s,    out) {
    out = s
    gsub(/\|/, PIPE_TOKEN, out)
    return out
}

# Pick disposition + status purely from the review file's flags.
function disposition_from_flags(fixed_flag, wontfix_flag,    out) {
    if (wontfix_flag ~ /\[x\]/) return "Won't Fix\t—"
    if (fixed_flag   ~ /\[x\]/) return "Fix\tDone"
    return "\t"
}

# Refine disposition + status from decisions status code.
function refine_from_decision(d_status, base_disp, base_stat,    out) {
    if (d_status == "AUTO_RESOLVED")     return "Auto-Resolved\t—"
    if (d_status == "WONT_FIX")          return "Won't Fix\t—"
    if (d_status == "DONE")              return "Fix\tDone"
    if (d_status == "FIX")               return "Fix\tNot Done"
    if (d_status == "FAILED")            return "Fix\tFailed"
    return base_disp "\t" base_stat
}

# --- Section detection ---

/^## Todo List[[:space:]]*$/ {
    print "## Items"
    in_todo = 1
    seen_separator = 0
    written_new_header = 0
    next
}

/^## / && in_todo {
    in_todo = 0
    seen_separator = 0
    print
    next
}

!in_todo { print; next }

# Header line (before separator)
in_todo && !seen_separator && /^\|/ {
    if (!written_new_header) {
        print "| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |"
        print "|---|------|------|----------|----------|-------|-----|-------------|--------|-------|"
        written_new_header = 1
        seen_separator = 1
    }
    next
}

in_todo && /^\|[[:space:]]*-+/ {
    if (!written_new_header) {
        print "| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |"
        print "|---|------|------|----------|----------|-------|-----|-------------|--------|-------|"
        written_new_header = 1
        seen_separator = 1
    }
    next
}

in_todo && seen_separator && /^\|/ {
    line = $0
    gsub(/\\\|/, PIPE_TOKEN, line)
    n = split(line, p, /\|/)

    if (n < 11) {
        print "# MIGRATION-WARN: row dropped (< 11 cols): " $0 > "/dev/stderr"
        next
    }

    id       = trim(p[2])
    file     = trim(p[3])
    line_col = trim(p[4])
    severity = trim(p[5])
    category = trim(p[6])
    fixed_flag   = trim(p[n-2])
    wontfix_flag = trim(p[n-1])
    issue = trim(p[7])
    fix = ""
    for (i = 8; i <= n - 3; i++) {
        if (fix != "") fix = fix "|"
        fix = fix p[i]
    }
    fix = trim(fix)

    sub(/^#/, "", id)

    # Restore literal | in cell content for downstream comparisons
    file_clean = file
    gsub(PIPE_TOKEN, "|", file_clean)

    # 1) Base disposition from flags
    split(disposition_from_flags(fixed_flag, wontfix_flag), trip, "\t")
    disposition = trip[1]
    status_val  = trip[2]
    notes       = ""

    # 2) Refine + add notes from decision if (id matches AND file basename matches)
    if (id in decisions_status) {
        d_status = decisions_status[id]
        d_file   = decisions_file[id]
        d_notes  = decisions_notes[id]

        # Compare basename (strip backticks too)
        review_base   = basename(strip_backticks(file_clean))
        decision_base = basename(d_file)

        if (review_base != "" && review_base == decision_base) {
            split(refine_from_decision(d_status, disposition, status_val), trip2, "\t")
            disposition = trip2[1]
            status_val  = trip2[2]
            notes       = d_notes
        }
    }

    cells[1]  = "#" id
    cells[2]  = escape_for_table(file_clean)
    cells[3]  = escape_for_table(line_col)
    cells[4]  = escape_for_table(severity)
    cells[5]  = escape_for_table(category)
    cells[6]  = escape_for_table(issue)
    cells[7]  = escape_for_table(fix)
    cells[8]  = escape_for_table(disposition)
    cells[9]  = escape_for_table(status_val)
    cells[10] = escape_for_table(notes)

    out = "|"
    for (i = 1; i <= 10; i++) out = out " " cells[i] " |"
    gsub(PIPE_TOKEN, "\\|", out)
    print out
    next
}

in_todo && seen_separator && /^[[:space:]]*$/ {
    print
    in_todo = 0
    seen_separator = 0
    next
}

{ print }
