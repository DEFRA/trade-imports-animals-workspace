Research ONE completed ticket and decide how it should be told to
a non-technical audience: a plain-English headline, the user-facing
benefit, and which of the four audience categories it belongs to.
You write exactly one ticket's analysis into the shared state via
`ticket-set-analysis.sh`. You do NOT write slides — the parent
synthesises the themed deck from all analyses.

## Bash call hygiene

**Rule: one command per Bash call.** The allowlist matcher sees
the whole command string; chains and pipes don't match the prefix
rule even when each piece would.

- No `&&` / `;` / `|` between commands — separate Bash calls.
- No `cd <dir> && cmd` — use `cmd -C <dir>` (git), full paths to
  binaries, or `--prefix` / `-f` flags.
- No `find ... -exec` — use Glob + Read.
- No `$VAR` in LLM-typed Bash — use literal
  `~/git/defra/trade-imports-animals-workspace/...` paths.
- No `/Users/<you>/git/...` resolved form — type the `~/` form.
- No `python3 -c` for JSON — use `jq`.
- No `awk` / `sed -n` / `grep -n` for file inspection — use Read
  with offset+limit.

Full rule table:
`~/git/defra/trade-imports-animals-workspace/docs/agent-skills.md`.

## Inputs

The parent provides, in the spawn prompt:

- `--run-id <id>` — the showcase run.
- `--key EUDPA-XXXX` — the one ticket you analyse.
- The path to the pre-baked context bundle for this ticket:
  `~/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/<id>/context/<key>/`
  (written by `prepare-sprint-showcase.sh`). It contains the Jira
  ticket summary + description and the commit messages / diffstat
  for commits referencing the key.

## Workflow

1. Read the pre-baked context bundle for your `--key`. Do not
   re-fetch from Jira or git — the bundle is authoritative for this
   run (pattern 3, pre-baked context).
2. Work out, in plain English, **what changed from a user's point
   of view**. Ignore implementation detail. If the bundle is thin,
   read the referenced commit diffstat for signal — but the output
   must be benefit-led, not change-led.
3. Pick exactly ONE category (see the table in
   `assets/sprint-showcase-schema.md`):
   - `NEW_FEATURE` — a capability that did not exist before.
   - `IMPROVEMENT` — an existing capability made better/easier/faster.
   - `BUG_FIX` — something broken now works (reliability).
   - `QUALITY_OR_VELOCITY` — technical/quality/test/tooling/infra
     work with no direct user-facing change; framed as "lets us
     ship faster and more safely".
   When a ticket spans more than one, pick the category the
   audience would care about most (a feature that also fixes a bug
   is a `NEW_FEATURE`).
4. Write a `headline` — one audience-facing sentence, no jargon, no
   ticket number, present tense ("Traders can now …", "Border
   checks are now …").
5. Write a `user_benefit` — one or two sentences on the concrete
   benefit (time saved, risk reduced, new thing possible). For
   `QUALITY_OR_VELOCITY`, frame it as delivery speed / quality, not
   the technical change itself.
6. Set `confidence` (`high` / `medium` / `low`) — `low` if the
   bundle gave you little to go on; the parent uses this to decide
   whether to aggregate or drop the ticket.
7. Cite `evidence` — at least the ticket key, plus any commit refs
   (`<repo-short>@<sha>`) you relied on. No evidence → no claim.

Persist with a single helper call:

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/ticket-set-analysis.sh \
    --run-id <id> --key EUDPA-XXXX \
    --category NEW_FEATURE \
    --headline "Traders can now upload many certificates at once" \
    --user-benefit "Cuts a 20-minute manual task to one upload, so consignments clear faster" \
    --confidence high \
    --evidence "EUDPA-XXXX,frontend@abc1234"
```

## Return value

One line the parent aggregates:
`<key> → <CATEGORY> (<confidence>): <headline>`.
