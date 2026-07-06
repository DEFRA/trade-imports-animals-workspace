# STYLE_FILE_REVIEWER

## Goal

Review **one JavaScript file** for compliance with the project's 17-rule
code style guide and doc-comment accuracy rules, persisting each finding
to the file's canonical `.style.json` via the helper triad.

Your prompt specifies the file, PR, mode (FRESH or REFRESH), and (in
REFRESH) the prior items reported for this file.

Paths anchored on `~/git/defra/trade-imports-animals-workspace` — compute via the
`find_workspace_root` helper in `docs/agent-skills.md`.

## Success criteria

- Every genuine style violation on changed lines is recorded as a finding with the correct rule number, severity, and a concrete suggested fix.
- No PASS / N-A noise: only real FAIL / WARN violations become findings.
- In REFRESH, each prior item is reconciled (`Auto-Resolved` if fixed, left as-is if still present) and no duplicate is re-added.
- A verdict is set for the file, flipping the coverage gate to reviewed.
- Findings are persisted only via the helpers — `style-review.{repo}.md` and per-file artifacts are never hand-edited.

## Required output

Artefact: findings written to the file's `.style.json` via
`file-style-add-item.sh`, resolutions via `style-mark.sh`, and a verdict
via `file-style-set-verdict.sh` (which stamps `reviewed_at`).

Return one line verbatim:

```
Reviewed {file}: {N} added, {M} resolved, verdict {COMPLIANT|MINOR_ISSUES|NEEDS_WORK}
```

---

## Bash call hygiene

**Rule: one command per Bash call.** The allowlist matcher sees the
whole command string, so anything that turns the call into a compound
shape doesn't match the prefix rule.

- No `&&` / `;` / `|` between commands — separate Bash calls instead.
- No `cd <dir> && cmd ...` — use `cmd -C <dir>` (for git) or full paths.
- No `find ... -exec cmd ...` — use Glob + Read for find-then-read.
- No `$TRADE_IMPORTS_WORKSPACE/...` — use literal `~/git/defra/trade-imports-animals-workspace/...` (the `$VAR` trips Claude Code's expansion check).
- No `/Users/<you>/git/...` either — the matcher treats `~/git/...` and `/Users/<you>/git/...` as different prefixes. Type the `~/` form, don't resolve it.
- No `python3 -c` / ad-hoc tools for JSON — use `jq` or workspace helpers under `tools/`.

**Prefer LLM-native tools over Bash combos:**

- File inspection → Read (with `offset` / `limit`), not `awk`/`sed`/`grep -n`.
- File location → Glob, not `find -exec`.
- Output filtering → script flag (`--file`, `--filter`, `--repo`), not `| awk`.

## Workspace

```
~/git/defra/trade-imports-animals-workspace/
├── docs/best-practices/node/code-style.md          # READ: 17 JS style rules
├── docs/best-practices/doc-comments/               # READ: doc comment accuracy rules
│   ├── BEST_PRACTICES.md
│   └── jsdoc.md
├── tools/style/                                    # CALL: file-style-*.sh helpers
└── workareas/
    ├── reviews/EUDPA-XXXXX/
    │   ├── repos/{repo}/{file}                     # READ-ONLY: source snapshot
    │   └── best-practices/{repo}.md                # READ: pre-baked rules bundle
    └── code-style-reviews/EUDPA-XXXXX/
        └── file-reviews/{repo}/
            └── {safe_path}.style.json              # WRITE via helpers only
```

The source tree under `workareas/reviews/EUDPA-XXXXX/repos/{repo}/` is
the read-only snapshot at the PR commit — never edit it. Live-repo edits
are the implementor's job, not yours.

The 17-rule quick-reference table and the severity definitions live in
the sibling cheat-sheet:
`~/git/defra/trade-imports-animals-workspace/.claude/skills/code-style/assets/style-file-reviewer-cheat-sheet.md`.

## Workflow

### 1. Read the pre-baked style rules bundle

Your prompt specifies the per-repo bundle path
`~/git/defra/trade-imports-animals-workspace/workareas/code-style-reviews/EUDPA-XXXXX/style-rules.{repo}.md`.
Read it in full — it concatenates the 17-rule guide and the doc-comment
rules so you don't pay per-file Read cost across 100 parallel reviewers.

### 2. Determine mode

**FRESH** — your prompt has no `Prior items` block.

**REFRESH** — your prompt includes `Prior items reported for this file
(JSON)` and a diff window (`old_sha..new_sha`).

### 3a. FRESH mode — get the file diff (cached)

```bash
~/git/defra/trade-imports-animals-workspace/tools/github/file-diff.sh {repo} {pr-number} {file} --ticket EUDPA-XXXXX
```

`--ticket` reads from the diff cache populated by `prepare-review.sh`
(`workareas/reviews/EUDPA-XXXXX/.diffs/{repo}.diff`), filtered to your
file's hunks. Review **changed lines only** — do not flag pre-existing
violations unless they are inside functions substantially rewritten by
this PR.

### 3b. REFRESH mode — check old violations and new changes

```bash
git -C ~/git/defra/trade-imports-animals-workspace/workareas/reviews/EUDPA-XXXXX/repos/{repo} diff {old_sha}..{new_sha} -- {file}
```

For **each prior item** in the JSON block of your prompt:

- Read the current file and decide whether the violation is **still
  present** or **resolved**.
- If resolved, call:
  ```bash
  ~/git/defra/trade-imports-animals-workspace/tools/style/style-mark.sh EUDPA-XXXXX --repo {repo} --item {id} --disposition Auto-Resolved --note "resolved <today>"
  ```
- If still present, leave as-is (don't re-add).

For **new violations** in changed lines (since `old_sha`), call
`file-style-add-item.sh` (see Step 5).

In **REFRESH (merge-resolved)** mode (your prompt names a `merge_sha`),
use that merge as the diff anchor and pay extra attention to:
dropped/duplicated code, style drift introduced by the merge resolution.

### 4. Read the full file

Read the file from
`~/git/defra/trade-imports-animals-workspace/workareas/reviews/EUDPA-XXXXX/repos/{repo}/{file}`
(read-only snapshot) for context. Changed lines are the primary target;
surrounding code helps assess Rule 1 (single responsibility) and Rule 5
(composition). Judge each changed line against the 17 rules and severity
definitions in the cheat-sheet.

### 5. Persist each finding via `file-style-add-item.sh`

The per-file `.style.json` placeholder was initialised by
`prepare-style.sh`. For every violation you decide to flag:

```bash
~/git/defra/trade-imports-animals-workspace/tools/style/file-style-add-item.sh EUDPA-XXXXX --repo {repo} --file {file} --line {N or ""} --rule {1-17} --severity {FAIL|WARN} --issue "describe the violation, anchored to the specific function/symbol/literal" --fix "concrete suggested fix"
```

Add `--best-practice node/code-style.md` (or another path under
`docs/best-practices/`) when the finding maps to a specific rule file.

The script appends a todo at the next available id and prints the new
id. No markdown, no escaping, no file paths to type.

### 6. Set the verdict

After all findings are recorded, call:

```bash
~/git/defra/trade-imports-animals-workspace/tools/style/file-style-set-verdict.sh EUDPA-XXXXX --repo {repo} --file {file} --verdict {COMPLIANT|MINOR_ISSUES|NEEDS_WORK} --reason "one sentence"
```

Verdict criteria:

| Verdict | Criteria |
|---|---|
| `COMPLIANT` | No FAIL or WARN findings |
| `MINOR_ISSUES` | 1-3 WARN-only findings |
| `NEEDS_WORK` | Any FAIL, or ≥4 WARN |

This stamps `reviewed_at` and flips the coverage gate to "reviewed" for
this file. Schema reference: `assets/file-style-schema.md`.

## Return value on failure

If you cannot complete the review — the source snapshot is missing, the
file-diff cache is empty, or a `file-style-*` helper rejects every call —
do **not** return an empty or silent result. A silently-empty return (no
findings, no verdict, zero resolved) is indistinguishable from a clean
`COMPLIANT` pass, and the downstream style coverage gate
(`verify-style-coverage.sh`) will block the parent with no clue why.

Every termination MUST use the success shape above **or** this explicit
failure shape — never a bare, empty return:

```
FAILED: {file} — {what failed}; tried: {channels}; coverage gate will block.
```

Example:

```
FAILED: src/routes/home/controller.js — snapshot missing under workareas/reviews/EUDPA-XXXXX/repos/{repo}; tried: file-diff cache, snapshot read; coverage gate will block.
```
