# Agent skills format note

This workspace uses the [agentskills.io](https://agentskills.io/specification)
standard for Claude Code skills. Each skill lives at the workspace root under
`.claude/skills/<name>/`, with a `SKILL.md` entry point and optional
`references/` and `assets/` subdirectories. Claude Code-specific subagents
live alongside skills at `.claude/agents/<name>.md`.

This document is the canonical reference for the workspace-level conventions
that every `SKILL.md` and subagent cite. It exists once here so individual
skills don't duplicate the prose.

## Workspace root resolution

Skills must NOT assume the agent's current working directory. Claude Code can
invoke a skill from anywhere — workspace root, `docs/`, or wherever the
process happens to land. Sub-repos under `repos/<service>/` are themselves
git repositories, so `git rev-parse --show-toplevel` returns the sub-repo
root when called from inside one — silently breaking any path that should be
workspace-relative.

`CLAUDE_PROJECT_DIR` and `CLAUDE_SKILL_DIR` are unset inside skill bash
blocks (hook-only at the time of writing). Use the walk-up helper below; the
seed is a free fast-path if a future Claude Code release exposes the
variable to skills.

The marker is the **co-presence of `.claude/skills/` AND `docs/`** at the
same directory. Sub-repos under `repos/` carry neither, so the walk-up skips
past them cleanly.

```bash
find_workspace_root() {
  local d="${CLAUDE_PROJECT_DIR:-$PWD}"
  while [ "$d" != "/" ]; do
    [ -d "$d/.claude/skills" ] && [ -d "$d/docs" ] && { printf '%s\n' "$d"; return 0; }
    d=$(dirname "$d")
  done
  echo "workspace root not found (need .claude/skills/ + docs/ co-located)" >&2
  return 1
}
WORKSPACE_ROOT="$(find_workspace_root)" || exit 1
```

Compute `WORKSPACE_ROOT` once per session inside `SKILL.md` bash blocks.

## Path conventions

Cross-workspace references in `SKILL.md` use absolute paths anchored on
`${WORKSPACE_ROOT}`:

```
Scripts:        ${WORKSPACE_ROOT}/tools/<domain>/<script>
Best-practices: ${WORKSPACE_ROOT}/docs/best-practices/<topic>/<file>
Workareas:      ${WORKSPACE_ROOT}/workareas/...
Other skills:   ${WORKSPACE_ROOT}/.claude/skills/<name>/...
```

Skill-internal references stay relative from `SKILL.md`:

```
references/<NAME>.md
assets/<NAME>.md
```

Subagents are addressed by name through the Task/Agent tool — no path
needed. Claude Code resolves them from `.claude/agents/`.

## Skill folder shape

```yaml
---
name: skill-name          # 1-64 chars [a-z0-9-]; MUST match the folder name
description: ...          # 1-1024 chars; WHAT + WHEN + trigger keywords
---
```

- `SKILL.md` body should stay under 500 lines / ~5000 tokens.
- `references/<NAME>.md` — additional docs loaded on demand.
- `assets/<NAME>.md` — templates, schemas, static resources.
- Skills do NOT carry private `scripts/` folders in this workspace: shared
  shell scripts live at `${WORKSPACE_ROOT}/tools/`.

Spawn idiom inside `SKILL.md`:

- For a reference: `Follow references/<NAME>.md`.
- For a subagent: `Delegate to the <name> subagent`.

## Subagent shape

`.claude/agents/<owner-skill>/<name>.md` (or flat `.claude/agents/<name>.md` if
preferred — Claude Code walks `.claude/agents/` recursively at project
scope; the subdirectory path is purely organisational and does not
affect identity). Frontmatter:

```yaml
---
name: subagent-name
description: When the parent should delegate to this subagent.
tools: Read, Grep, Glob
---
```

- `tools:` is a **restricted allowlist** — least privilege. Widen only when
  the sub-role provably needs it.
- **No `model:` field.** Subagents inherit the parent session's model.
  Pinning a named model would rot the config across model bumps.
- `name:` values must be unique tree-wide — Claude Code will silently
  drop duplicates when two files declare the same name.
- The body is the persona prose. Drop "spawned by X" preambles — the
  invocation context is now the subagent contract itself.

## Cross-host discovery

- **Skills** — `.claude/skills/` works for both Claude Code (native) and
  Cursor (per <https://cursor.com/docs/context/skills>).
- **Subagents** — Claude Code-specific. Cursor ignores `.claude/agents/`;
  the underlying sub-personas still work through skill prose without
  parallel fan-out / context isolation.
- **Subdirectory launches** — Claude Code's `.claude/skills/` does NOT walk
  up parent directories (#26489). The workspace ships `docs/.claude → ../.claude`
  so a session launched from `docs/` still discovers the skills.
- **Sub-repos** — `repos/<service>/` are nested git repos; Claude Code
  sandboxes them off the parent workspace's `.claude/` (#31905). Do NOT
  symlink into them. Working inside a sub-repo means no workspace skills.

## Runtime workareas

`${WORKSPACE_ROOT}/workareas/` is runtime cache and is gitignored. Skills
populate it (reviews, code-style reviews, ticket plans, upgrades) as they
run; nothing under `workareas/` is part of the checked-in audit trail.
