Research one govuk-frontend version's changelog entry and write a plan
for what (if anything) needs changing in the repo.

Your prompt names the run, repo, version, and stub file path.

Paths anchored on `~/git/defra/trade-imports-animals` — compute via the `find_workspace_root`
helper in `docs/agent-skills.md`.

---

## Bash call hygiene

**Rule: one command per Bash call.** The allowlist matcher sees the
whole command string, so anything that turns the call into a compound
shape doesn't match the prefix rule.

- No `&&` / `;` / `|` between commands — separate Bash calls instead.
- No `cd <dir> && cmd ...` — use `cmd -C <dir>` (for git) or full paths.
- No `find ... -exec cmd ...` — use Glob + Read for find-then-read.
- No `$TRADE_IMPORTS_WORKSPACE/...` — use literal `~/git/defra/trade-imports-animals/...` (the `$VAR` trips Claude Code's expansion check).
- No `/Users/<you>/git/...` either — the matcher treats `~/git/...` and `/Users/<you>/git/...` as different prefixes. Type the `~/` form, don't resolve it.
- No `python3 -c` / ad-hoc tools for JSON — use `jq` or workspace helpers under `tools/`.

**Prefer LLM-native tools over Bash combos:**

- File inspection → Read (with `offset` / `limit`), not `awk`/`sed`/`grep -n`.
- File location → Glob, not `find -exec`.
- Output filtering → script flag (`--file`, `--filter`, `--repo`), not `| awk`.

## Boundaries

Research and plan only. Do not edit source files, run npm commands, or
attempt any implementation.

---

## Inputs

- `{run-id}`, `{repo-name}`, `{repo-path}`, `{version}`
- Stub file: `~/git/defra/trade-imports-animals/workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.md`

---

## Workflow

1. Fetch changelog section for this version.
2. Scan relevant files in the repo for patterns from the changelog.
3. Write `.todo` or `.noop` plan.
4. Delete the zero-byte stub.

---

## Step 1: Get the changelog section

```bash
~/git/defra/trade-imports-animals/tools/govuk/fetch-changelog-section.sh {version} \
  --run-id {run-id} \
  --repo {repo-name}
```

Read the output carefully. Focus on:

- **Breaking changes** — must address
- **Recommended changes** — address if patterns match
- **Deprecated features** — note for awareness

---

## Step 2: Scan the repo

For each breaking change, recommended change, or deprecated feature in
the changelog, grep for the relevant pattern in
`~/git/defra/trade-imports-animals/repos/{repo-name}/src`.

**File types to scan and what to look for:**

| Extension | What to grep for |
|-----------|-----------------|
| `*.njk`, `*.html`, `*.hbs` | Macro names (e.g. `govukHeader`), parameter names (e.g. `serviceName`), CSS class names (e.g. `govuk-header__service-name`) |
| `*.scss`, `*.css` | SCSS variables (`$govuk-`), mixin names, `@forward`/`@use`/`@import` paths |
| `*.js`, `*.ts`, `*.mjs` | Import paths (`govuk-frontend`), class names, constructor calls, method names |
| `package.json` | The `govuk-frontend` version constraint |

Example grep commands:

```bash
grep -r --include="*.njk" --include="*.html" --include="*.hbs" "serviceName" ~/git/defra/trade-imports-animals/repos/{repo-name}/src
grep -r --include="*.scss" "\$govuk-colour" ~/git/defra/trade-imports-animals/repos/{repo-name}/src
grep -r --include="*.js" --include="*.ts" --include="*.mjs" "initAll" ~/git/defra/trade-imports-animals/repos/{repo-name}/src
```

---

## Step 3: Write plan

### If any files match patterns requiring changes → write `.todo`

File:
`~/git/defra/trade-imports-animals/workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.todo`

```markdown
# govuk-frontend v{version} — Upgrade Plan

**Repository:** {repo-name}
**Version:** {version}
**Date:** {YYYY-MM-DD}

## Changelog

{Paste the full changelog section for this version verbatim}

## Changes Required

### {relative/path/to/file.njk}

**Why:** {which changelog item requires this — quote the relevant line}
**Change:** {specific, actionable description of what to change, with before/after if helpful}

### {relative/path/to/file.scss}

**Why:** ...
**Change:** ...

## Files Scanned (no changes needed)

{List files that were checked but had no matching patterns — gives reviewer confidence}
```

### If no files match any changelog patterns → write `.noop`

File:
`~/git/defra/trade-imports-animals/workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.noop`

```markdown
# govuk-frontend v{version} — No Changes Required

**Repository:** {repo-name}
**Version:** {version}
**Date:** {YYYY-MM-DD}

## Changelog

{Paste the full changelog section for this version verbatim}

## Assessment

No patterns from this changelog entry were found in the repo's source files.

## Patterns Checked

| Pattern | Files searched | Result |
|---------|---------------|--------|
| `{pattern}` | `src/**/*.njk` | not found |
| `{pattern}` | `src/**/*.scss` | not found |
```

---

## Step 4: Delete the zero-byte stub

```bash
rm ~/git/defra/trade-imports-animals/workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.md
```

---

## Classification guide

**Write `.todo` when:**

- Any breaking changes apply to files in this repo
- Any recommended changes affect files in this repo
- A deprecated feature is actively used (even if not yet breaking)

**Write `.noop` when:**

- No patterns from Breaking changes or Recommended changes appear in the repo
- Changes are purely internal to govuk-frontend (bug fixes, internal refactors, accessibility improvements not requiring template changes)

**When in doubt → `.todo`**
