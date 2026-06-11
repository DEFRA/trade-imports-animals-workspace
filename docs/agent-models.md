# Model routing — Cursor Pro + Claude Pro

Skills resolve the right model for each workflow stage automatically.
The host UI still needs you to confirm the switch — agents cannot
change the Cursor picker or run `/model` for you.

Canonical config: `docs/agent-models.json`  
Lookup script: `tools/agent/resolve-model.sh`

## Automatic lookup (per stage)

Prepare/start scripts print a **model gate** before any work:

| Trigger | Script | Session role |
|---|---|---|
| `plan EUDPA-X` | `prepare-plan.sh` | `plan` |
| `implement EUDPA-X` | `prepare-implement.sh` | `implement` |
| `review EUDPA-X` | `start-review.sh` | `review-orchestrator` |
| `style review EUDPA-X` | `start-style.sh` | `review-orchestrator` |
| `refactor` | `resolve-model.sh --role refactor` | `refactor` (= implement) |

Example output (Cursor):

```
MODEL: {"role":"implement","host":"cursor",...,"session":{"picker_label":"Composer 2.5",...}}

Model gate — role: implement · host: cursor · subscription: cursor_pro_claude_pro

Session: select "Composer 2.5" in the Cursor Agent model picker.
  slug: composer-2.5-fast

Confirm the model is set, then continue the workflow.
```

Example output (Claude Code):

```
Session: run /model sonnet in this chat before continuing.
  Complex tickets: /model opus
```

**Agent rule:** read the gate, ask you to switch if needed, wait for
confirmation, then continue. Do not skip the gate.

Manual lookup:

```bash
~/git/defra/trade-imports-animals-workspace/tools/agent/resolve-model.sh --trigger "plan EUDPA-1234"
~/git/defra/trade-imports-animals-workspace/tools/agent/resolve-model.sh --worker review-worker --json
```

## Pro defaults (Cursor Pro + Claude Pro)

| Role | Cursor (session) | Claude Code (session) | Task workers |
|---|---|---|---|
| `plan` | Sonnet 4.6 (thinking) | `/model sonnet` (Opus if complex) | — |
| `implement` | **Composer 2.5** | `/model sonnet` (Opus if hard) | inherit session |
| `review-orchestrator` | **Opus 4.8** (not Composer) | `/model opus` | inherit session |
| `review-worker` | — | — | Cursor: `gemini-3.5-flash` · Claude: `haiku` |

Edit slugs in `agent-models.json` if your picker labels differ.

## Session models (parent chat)

Use a **new chat** per major phase. Review must not reuse the implement chat.

### Cursor

Model picker before the trigger. Slugs in `agent-models.json` →
`roles.<role>.hosts.cursor.session_slug`.

### Claude Code

`/model` before the trigger. Commands in
`roles.<role>.hosts.claude_code.model_command`.

## Worker models (Task spawns)

Before fan-out, resolve once:

```bash
~/git/defra/trade-imports-animals-workspace/tools/agent/resolve-model.sh --worker review-worker --host auto --json
```

Pass `task_slug` on each Task spawn when supported. Omit on fixers
(`REVIEW_ITEM_FIXER`, `STYLE_IMPLEMENTOR`) and `CONSISTENCY_REVIEWER`.

## Rules

1. **Review ≠ implement chat** — new chat + orchestrator role.
2. **Confirm after model gate** — don't proceed until the session model matches.
3. **Edit `agent-models.json` only** — skills and scripts point there.
4. Cursor fan-out may run serially; worker `model` still applies per spawn.
