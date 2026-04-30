#!/usr/bin/awk -f
# Update Disposition / Status / Notes on a specific row in the `## Items` table.
#
# Usage:
#   awk -v ITEM_ID=N \
#       -v SET_DISP=1 -v VAL_DISP="Fix" \
#       -v SET_STAT=1 -v VAL_STAT="Not Done" \
#       -v SET_NOTE=1 -v VAL_NOTE="some text" \
#       -f update-item.awk review.repo.md > new.md
#
# SET_* flags default to 0 (don't change the column).
# Exits with code 2 and writes "ITEM_NOT_UPDATED <id>" to stderr if the item is not found.

BEGIN {
    in_items = 0
    seen_separator = 0
    PIPE_TOKEN = "<<<PIPE>>>"
    updated = 0
}

function escape_pipes(s,    out) {
    out = s
    gsub(/\|/, PIPE_TOKEN, out)
    return out
}

# Section heading
$0 ~ /^## / {
    if ($0 ~ /^## Items[[:space:]]*$/) {
        in_items = 1
        seen_separator = 0
    } else if (in_items) {
        in_items = 0
        seen_separator = 0
    }
    print
    next
}

!in_items { print; next }

# Blank line inside items section ends the table
seen_separator && $0 ~ /^[[:space:]]*$/ {
    in_items = 0
    seen_separator = 0
    print
    next
}

# Separator row
$0 ~ /^\|[[:space:]]*-+/ {
    seen_separator = 1
    print
    next
}

# Header row before separator
!seen_separator && $0 ~ /^\|/ { print; next }

# Data row
seen_separator && $0 ~ /^\|/ {
    line = $0
    gsub(/\\\|/, PIPE_TOKEN, line)
    n = split(line, parts, /\|/)

    if (n >= 12) {
        cur_id = parts[2]
        gsub(/[ \t]/, "", cur_id)
        sub(/^#/, "", cur_id)

        if (cur_id == ITEM_ID) {
            if (SET_DISP+0) parts[9]  = " " escape_pipes(VAL_DISP) " "
            if (SET_STAT+0) parts[10] = " " escape_pipes(VAL_STAT) " "
            if (SET_NOTE+0) parts[11] = " " escape_pipes(VAL_NOTE) " "
            updated = 1
        }
    }

    out = parts[1]
    for (i = 2; i <= n; i++) {
        out = out "|" parts[i]
    }
    gsub(PIPE_TOKEN, "\\|", out)
    print out
    next
}

{ print }

END {
    if (!updated) {
        print "ITEM_NOT_UPDATED " ITEM_ID > "/dev/stderr"
        exit 2
    }
}
