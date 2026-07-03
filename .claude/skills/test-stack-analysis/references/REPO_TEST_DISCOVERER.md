Find every test file in ONE repo related to the flow/feature under
analysis, classify each by pyramid level (unit / integration / E2E)
per the taxonomy's per-repo rules, and note what concern(s) each one
appears to assert with file:line evidence. Write one markdown
inventory file — you do not decide gaps or duplication; that
cross-repo judgment happens in the parent session after all repo
workers finish.

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

The parent session's spawn prompt gives you:

- **Repo** — the repo name (one of the 8 in the workspace).
- **Repo path** — absolute path to that repo under `repos/`.
- **Flow/feature under analysis** — the resolved input text (ticket
  AC, Confluence content, or free-text description). This repo may
  have nothing to do with the flow — that's a valid, expected outcome
  for some repos on some runs, not an error.
- **Taxonomy reference** — path to
  `assets/concern-type-taxonomy.md`. Read this in full before
  starting; it contains the per-repo classification rules and known
  exception lists you need for step 2 below. Do not classify from
  memory or from general Maven/Vitest conventions — the exceptions in
  that file are specific, confirmed findings for these repos and
  override the general rule.
- **Output path** — where to write your inventory markdown file.

## Bash call hygiene reminder

No `find ... -exec` — use Glob to locate candidate test files, then
Read (with offset+limit, not `grep -n`/`sed -n`) to inspect content
for the classification exceptions. One command per Bash/Grep/Glob
call.

## Workflow

1. **Read the taxonomy reference file in full**, focusing on the
   "Pyramid-level classification, per repo" section for your assigned
   repo specifically — the rules differ meaningfully between Node
   colocated repos, the Node repo with a separate `test/unit`
   `test/integration` split, the four Java repos, and the Playwright
   repo. Do not apply another repo's rule to this one.

2. **State your repo's plausibility up front, then search anyway.**
   Before globbing, note in one line whether this repo's known role
   (per the workspace's repo map — e.g. an OIDC stub, a reference-data
   service, an event-forwarding gateway) makes this flow plausible or
   implausible. This is a stated expectation to verify, not a shortcut
   past searching — still glob and grep as below even when you expect
   "nothing here," and treat any keyword hit as a candidate to
   investigate and rule in or out explicitly (check it isn't a
   coincidental match — e.g. a generic field name, an unrelated scope
   string — before either citing it as a finding or dismissing it).

3. **Find candidate test files.** Glob for this repo's test file
   pattern (`**/*.test.js` for Node, `**/*Test.java` + `**/*IT.java`
   for Java, `**/*.spec.ts` for Playwright). Narrow to files whose
   path, describe/test names, or nearby source suggest relevance to
   the flow under analysis — grep for identifiers, route paths, or
   keywords drawn from the flow description. If the repo plausibly has
   nothing related to this flow, say so explicitly in your output
   rather than force-fitting unrelated files.

4. **Classify each candidate's pyramid level**, applying your repo's
   specific rule from the taxonomy file. For Node repos and the
   Playwright repo, this means checking the known-exception lists —
   grep file content (`createServer(`, `server.inject(`) rather than
   trusting the filename/directory alone whenever a candidate's path
   resembles a listed exception, or when you're not confident the
   general rule holds. For the Java repos, trust the `*Test`/`*IT`
   filename split directly — no content-grep needed there.

5. **For each classified file, note what concern(s) it appears to
   assert**, with file:line evidence pointing at the specific test
   method / `describe`/`test` block — not just "this file is
   relevant." Use the taxonomy's concern-type signals to give each
   assertion a tentative label (you are not making the final gap/
   duplication call — that's Step 2 in the parent session — but a
   tentative concern-type tag per finding saves the parent session
   from re-deriving it). For the Playwright repo specifically, apply
   the flow-attribution rules (filename+describe primary signal,
   nested describe/test.step fallback for `tests/a11y/*` and any file
   nesting multiple flows) — attribute by the correct nested level,
   not just the file as a whole.

6. **Write the inventory file** to the given output path:

```markdown
# Test inventory — <repo> — <run-id>

<one line: relevant to this flow, or "no related tests found in this repo">

## Candidate test files

### <file path>

- **Pyramid level:** unit | integration | E2E
- **Classification basis:** <filename rule | content-grep exception override>
- **Findings:**
  - `<test/describe name>` (line <N>) — <what it asserts, in one
    line> — tentative concern type: <taxonomy category>
```

Repeat the file-level subsection for each candidate. If nothing in
this repo relates to the flow, write that single line and stop — an
empty inventory is a valid, useful result.

## Return value

One line to the parent session: `<repo>: <N> candidate file(s) found`
(or `<repo>: no related tests found`) plus the output path.
