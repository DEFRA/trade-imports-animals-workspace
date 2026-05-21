# `## Items` table schema

The consolidated per-repo state lives in
`${WORKSPACE_ROOT}/workareas/reviews/EUDPA-XXX/review.{repo}.md` under a
single `## Items` table. The walker, batch implementor, and refresh
flows all read and mutate it via helper scripts under
`${WORKSPACE_ROOT}/tools/review/`. Never hand-edit the table body —
the scripts keep escaping consistent.

## Columns

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|

| Column | Meaning |
|---|---|
| `#` | Sequential ID, unique within the repo. Assigned by `review-add-item.sh`; do not reuse. |
| `File` | Path within the repo (no leading repo name). |
| `Line` | Line number in the file where the violation was reported (or `—` for whole-file findings). |
| `Severity` | `Critical` / `Major` / `Minor`. |
| `Category` | Short category tag from the file-reviewer (e.g. `correctness`, `security`, `error-handling`, `tests`). |
| `Issue` | One-line description of what is wrong. |
| `Fix` | One-line description of what to change. |
| `Disposition` | See "Disposition values" below. Hand-marked OR set by `review-mark.sh`. |
| `Status` | See "Status values" below. Set by `review-set-status.sh` (or auto-set by `review-mark.sh`). |
| `Notes` | Free-text note attached to the most recent disposition / status change. |

## Disposition values

| Value | Meaning | How set |
|---|---|---|
| (blank) | Pending — walker has not yet seen, user has not hand-marked. | Default for new rows. |
| `Fix` | The fixer should attempt this. | Walker on `F`; user hand-mark; batch implementor's `WON'T FIX` does NOT touch this. |
| `Won't Fix` | Decided not to fix. | Walker on `W`; user hand-mark; fixer's `WON'T FIX` outcome. |
| `Discuss` | Defer to a wider conversation. | Walker on `D` (when conversation didn't conclude). |
| `Auto-Resolved` | Violation no longer present (e.g. fixed by an earlier commit). | Walker Step 3a's auto-check; fixer's `SKIPPED` outcome. |

## Status values

| Value | Meaning | How set |
|---|---|---|
| (blank) | No fix attempt yet. | Default before walker / hand-marking. |
| `Not Done` | Queued for the implementor. | `review-mark.sh --disposition "Fix"` auto-sets this. |
| `Done` | Implementor reports the fix landed (a short SHA goes in Notes). | `review-set-status.sh --status Done`. |
| `Failed` | Implementor tried and failed; can be retried by re-running. | `review-set-status.sh --status Failed`. |
| `—` | Status doesn't apply (e.g. Won't Fix / Auto-Resolved rows). | Auto-set by `review-mark.sh` for non-Fix dispositions. |

## Escape rules

Literal `|` characters inside any cell MUST be escaped as `\|` to keep
the Markdown table well-formed. The helper scripts apply this rule when
adding or updating rows; if you need to inspect a row directly, expect
`\|` in cell content rather than `|`.

## Refresh interaction

During refresh (Step R3.5 / R6) the table is the source of truth for
"what we already decided":

- `Won't Fix` / `Auto-Resolved` rows are carried forward and MUST NOT be
  re-reported as new findings.
- `Fix` + `Done` rows are spot-checked — if the pattern is back, log as
  a regression in the Refresh Summary (do not change disposition; let
  the user re-walk).
- `Fix` + `Not Done` and `Discuss` rows stay open.
- Blank-disposition rows are pending — walker picks them up.

Deleted files: mark their items `Auto-Resolved` via `review-mark.sh`.
