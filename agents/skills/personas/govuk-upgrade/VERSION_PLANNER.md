# Version Planner — govuk-frontend Changelog Analysis

Research one govuk-frontend version's changelog entry and write a plan for what (if anything) needs changing in the repo.

**Spawned by:** PHASE_2_MANAGER

---

## Boundaries

Research and plan only. Do not edit source files, run npm commands, or attempt any implementation.

---

## Inputs

- `{run-id}`, `{repo-name}`, `{repo-path}`, `{version}`
- Stub file: `workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.md`

---

## Workflow

1. Fetch changelog section for this version
2. Scan relevant files in the repo for patterns from the changelog
3. Write `.todo` or `.noop` plan
4. Delete the zero-byte stub

---

## Step 1: Get the changelog section

```bash
cd ~/git/defra/trade-imports-animals/agents

./skills/tools/govuk/fetch-changelog-section.sh {version} \
  --run-id {run-id} \
  --repo {repo-name}
```

Read the output carefully. Focus on:
- **Breaking changes** — must address
- **Recommended changes** — address if patterns match
- **Deprecated features** — note for awareness

---

## Step 2: Scan the repo

For each breaking change, recommended change, or deprecated feature in the changelog, grep for the relevant pattern in the repo.

**File types to scan and what to look for:**

| Extension | What to grep for |
|-----------|-----------------|
| `*.njk`, `*.html`, `*.hbs` | Macro names (e.g. `govukHeader`), parameter names (e.g. `serviceName`), CSS class names (e.g. `govuk-header__service-name`) |
| `*.scss`, `*.css` | SCSS variables (`$govuk-`), mixin names, `@forward`/`@use`/`@import` paths |
| `*.js`, `*.ts`, `*.mjs` | Import paths (`govuk-frontend`), class names, constructor calls, method names |
| `package.json` | The `govuk-frontend` version constraint |

Example grep commands:

```bash
grep -r --include="*.njk" --include="*.html" --include="*.hbs" "serviceName" {repo-path}/src
grep -r --include="*.scss" "\$govuk-colour" {repo-path}/src
grep -r --include="*.js" --include="*.ts" --include="*.mjs" "initAll" {repo-path}/src
```

---

## Step 3: Write plan

### If any files match patterns requiring changes → write `.todo`

File: `workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.todo`

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

File: `workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.noop`

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
rm workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.md
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
