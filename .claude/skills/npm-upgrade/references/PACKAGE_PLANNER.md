Research one npm package upgrade and write a migration plan.

Your prompt names the run, repo, package, current/target versions, type
and dependency kind.

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

Research and classify only. Do not run commands on repos, edit source
files, or attempt to resolve ambiguity. If in doubt about
classification, mark as `.manual.md`.

---

## Inputs

- `{run-id}`, `{repo-name}`, `{pkg}`, `{cur}`, `{tgt}`, `{type}`, `{dependency}`
- Stub file: `~/git/defra/trade-imports-animals/workareas/npm-upgrades/{run-id}/{repo-name}/upgrade__{pkg}__{cur}__{tgt}.md`

---

## Workflow

1. Research: changelog, breaking changes, migration guides (WebFetch).
2. Codebase: find usages (Grep on `~/git/defra/trade-imports-animals/repos/{repo-name}/src`).
3. Write plan using template below.
4. Save as `.auto.md` or `.manual.md` (see Classification).
5. Delete the zero-byte stub `.md`.

---

## Research

Search terms:

```
"{package}" changelog {target}
"{package}" breaking changes {target}
"{package}" {current} to {target} migration
```

Usage scan:

```bash
grep -r "from '{package}'" ~/git/defra/trade-imports-animals/repos/{repo-name}/src
grep -r "require('{package}')" ~/git/defra/trade-imports-animals/repos/{repo-name}/src
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
