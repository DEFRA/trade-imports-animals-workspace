# Model routing — Cursor and Claude Code

Skills hand off via files in `workareas/` — each **phase starts in its
own chat** with the model suited to that job. Subagents (Task spawns)
use cheaper models for high-volume fan-out.

Canonical machine-readable map:
`~/git/defra/trade-imports-animals-workspace/docs/agent-models.json`.

## Session models (parent chat)

Pick the model **before** triggering the skill. Use a **new chat** per
phase so context stays bounded and review gets fresh eyes.

| Phase | Trigger | Role | Why |
|---|---|---|---|
| Plan | `plan EUDPA-X` | `plan` | Reasoning: Testing Strategy, scope, assumptions |
| Implement | `implement EUDPA-X` | `implement` | Strong coding + self-review |
| Refactor | `refactor` (post-green) | `refactor` | Same bar as implement |
| Review | `review EUDPA-X` | `review-orchestrator` | **Different chat/model from implement** — catches blind spots |
| Review fixes | `implement review EUDPA-X` | `implement` | Same as ticket implement |
| Style review fixes | `implement style fixes` | `implement` | Orchestrator; workers use `style-worker` |

### Cursor

Use the **model picker** on the Agent chat. Suggested slugs are in
`agent-models.json` → `roles.<role>.hosts.cursor.session_slug`. If a
slug is not on your plan, pick the closest tier from
`session_hint` instead.

### Claude Code

Run **`/model`** in the chat before the trigger. Follow
`session_hint` in `agent-models.json` → `roles.<role>.hosts.claude_code`.

## Worker models (Task spawns)

Only fan-out workers set an explicit Task `model` — the orchestrator
keeps the session model.

| Worker | Role | Hosts |
|---|---|---|
| `FILE_REVIEWER`, `STYLE_FILE_REVIEWER` | `review-worker` | Fast/cheap — high volume |
| `CONSISTENCY_REVIEWER` | `review-orchestrator` | One spawn — inherits session model (do not pass `model`) |
| `REVIEW_ITEM_FIXER`, `STYLE_IMPLEMENTOR` | — | Inherit session `implement` model |
| `AUDITOR` (skill-creator) | — | Inherit parent session model |

### How to spawn

1. Read `agent-models.json` once at the start of the phase.
2. Resolve the worker role (`review-worker`, etc.); if `same_as` is
   set, follow that role.
3. On **Cursor** or **Claude Code**, when the Task tool accepts
   `model`, pass the host's `task_slug` for that role. If `task_slug`
   is `null`, omit `model` (worker inherits parent).
4. If the slug is unavailable on your plan, omit `model` and continue.

Example (Cursor, per-file review):

```markdown
Task: subagent_type general-purpose, model composer-2.5-fast

Follow the instructions in ~/git/defra/trade-imports-animals-workspace/.claude/skills/review/references/FILE_REVIEWER.md.
...
```

Claude Code without Task `model` support: omit the parameter — workers
run on the parent model (slower/costlier on large PRs, still correct).

## Rules

1. **Review must not reuse the implement chat** — new chat + orchestrator role.
2. **Do not pass `model` on sequential fixers** — they edit source; use
   the implement session model.
3. **Edit slugs in `agent-models.json` only** — skills point here; don't
   hardcode model names in `SKILL.md` bodies.
4. Cursor runs fan-out **serially** when Task parallelism is unavailable —
   model routing still applies per spawn.
