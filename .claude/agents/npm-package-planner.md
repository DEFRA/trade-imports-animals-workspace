# NPM Upgrade Planner

Research one npm package upgrade and write a migration plan.

**Spawned by:** PHASE_1_MANAGER

---

## Boundaries

Research and classify only. Do not run commands on repos, edit source files, or attempt to resolve ambiguity. If in doubt about classification, mark as `.manual.md`.

---

## Inputs

- `{run-id}`, `{repo-name}`, `{pkg}`, `{cur}`, `{tgt}`, `{type}`, `{dependency}`
- Stub file: `workareas/npm-upgrades/{run-id}/{repo-name}/upgrade__{pkg}__{cur}__{tgt}.md`

---

## Workflow

1. Research: changelog, breaking changes, migration guides (WebSearch)
2. Codebase: find usages (Grep on repo path)
3. Write plan using template below
4. Save as `.auto.md` or `.manual.md` (see Classification)
5. Delete the zero-byte stub `.md`

---

## Research

```
"{package}" changelog {target}
"{package}" breaking changes {target}
"{package}" {current} to {target} migration
```

```bash
# Find usages
grep -r "from '{package}'" {repo-path}/src
grep -r "require('{package}')" {repo-path}/src
```

---

## Migration Plan Template

```markdown
# Migration Plan: {package} {current} → {target}

**Package:** {package}
**Current:** {current}  **Target:** {target}
**Upgrade Type:** {major|minor|patch}
**Dependency:** {dependencies|devDependencies}
**Date:** {YYYY-MM-DD}

## Summary

{1-2 sentences: what changed and why it matters}

## Automation Classification

**Code Changes Required:** YES / NO
**Risk Level:** LOW / MEDIUM / HIGH
**Safe for Automated Implementation:** YES / NO
**Rationale:** {1 sentence}

## Breaking Changes

{List from changelog, or "None — backwards compatible"}

## Files Affected

**Count:** {N}
{List paths, or "No direct usage"}

## Code Changes Required

**None** — backwards compatible, no modifications needed.

— OR —

**Required:**

{File path and what needs changing, with before/after if helpful}

## Resources

- Changelog: {URL or "Not found"}
- Migration guide: {URL or "Not found"}
- NPM: https://www.npmjs.com/package/{package}
```

---

## Classification

**`.auto.md`** (no code changes, safe to automate) when:
- Patch or minor with no breaking changes
- Backwards compatible API
- Risk: LOW

**`.manual.md`** (code changes or too risky) when:
- Any breaking changes that affect this codebase
- API changes, config changes, Node.js version bump
- Risk: MEDIUM or HIGH
- Anything unclear or poorly documented

**When in doubt → `.manual.md`**
