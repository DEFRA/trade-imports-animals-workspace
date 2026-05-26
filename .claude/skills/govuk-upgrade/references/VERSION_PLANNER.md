Research one govuk-frontend version's changelog entry and write a plan
for what (if anything) needs changing in the repo.

Your spawn prompt names the run, repo, version, the pre-baked changelog
file, and the pre-baked best-practices bundle.

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
- Source-code search → Grep tool (ripgrep semantics), not `grep -r` from Bash.
- Output filtering → script flag (`--file`, `--filter`, `--repo`), not `| awk`.

## Boundaries

Research and plan only. Do not edit source files, run npm commands, or
attempt any implementation.

---

## Inputs (provided in the spawn prompt)

- `{run-id}`, `{repo-name}`, `{repo-path}`, `{version}`
- Pre-baked changelog: `~/git/defra/trade-imports-animals/workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.changelog.md`
- Best-practices bundle: `~/git/defra/trade-imports-animals/workareas/govuk-upgrades/{run-id}/{repo-name}/best-practices.md`

Canonical state: `versions.{repo-name}.json` in the same directory.
Schema: `~/git/defra/trade-imports-animals/.claude/skills/govuk-upgrade/assets/version-state-schema.md`.

---

## Workflow

1. Read the pre-baked changelog section.
2. Scan the repo for patterns from the changelog (Grep tool).
3. Record findings via the `version-*` helpers.

---

## Step 1: Read the changelog section

Use the Read tool on the pre-baked file
`~/git/defra/trade-imports-animals/workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.changelog.md`.

Focus on:

- **Breaking changes** — must address
- **Recommended changes** — address if patterns match
- **Deprecated features** — note for awareness

Optionally Read the best-practices bundle when the changelog mentions
component / pattern / accessibility / styles areas:
`~/git/defra/trade-imports-animals/workareas/govuk-upgrades/{run-id}/{repo-name}/best-practices.md`.

---

## Step 2: Scan the repo

For each breaking change, recommended change, or deprecated feature in
the changelog, search the repo using the Grep tool.

**File types to scan and what to look for:**

| Extension | What to search for |
|-----------|--------------------|
| `*.njk`, `*.html`, `*.hbs` | Macro names (e.g. `govukHeader`), parameter names (e.g. `serviceName`), CSS class names (e.g. `govuk-header__service-name`) |
| `*.scss`, `*.css` | SCSS variables (`$govuk-`), mixin names, `@forward`/`@use`/`@import` paths |
| `*.js`, `*.ts`, `*.mjs` | Import paths (`govuk-frontend`), class names, constructor calls, method names |
| `package.json` | The `govuk-frontend` version constraint |

Use the Grep tool with `path: ~/git/defra/trade-imports-animals/repos/{repo-name}/src`
and `glob` filters such as `**/*.njk`, `**/*.scss`, `**/*.js`. Avoid
shelling out to `grep -r` — the Grep tool gives ripgrep semantics and
doesn't burn shell allowlist surface.

---

## Step 3: Record the classification

### If any files match patterns requiring changes → classify as `todo`

```bash
~/git/defra/trade-imports-animals/tools/govuk/version-classify.sh \
  --run-id {run-id} --repo {repo-name} --version {version} \
  --classification todo \
  --summary "{one-line: what this version changes}"
```

Then, for each file that needs editing:

```bash
~/git/defra/trade-imports-animals/tools/govuk/version-add-change.sh \
  --run-id {run-id} --repo {repo-name} --version {version} \
  --file {relative/path/to/file} \
  --why "{which changelog item requires this — quote the relevant line}" \
  --change "{specific, actionable description of what to change}"
```

Repeat for every file.

### If no files match any changelog patterns → classify as `noop`

```bash
~/git/defra/trade-imports-animals/tools/govuk/version-classify.sh \
  --run-id {run-id} --repo {repo-name} --version {version} \
  --classification noop \
  --summary "{one-line: why no changes needed}"
```

`version-classify.sh --classification noop` clears any stale `changes[]`
automatically — no further calls needed.

---

## Classification guide

**Classify as `todo` when:**

- Any breaking changes apply to files in this repo
- Any recommended changes affect files in this repo
- A deprecated feature is actively used (even if not yet breaking)

**Classify as `noop` when:**

- No patterns from Breaking changes or Recommended changes appear in the repo
- Changes are purely internal to govuk-frontend (bug fixes, internal refactors, accessibility improvements not requiring template changes)

**When in doubt → `todo`**

---

## Verifying your work

After your last helper call, the version entry in
`versions.{repo-name}.json` should have:

- `classification` set to `"todo"` or `"noop"`
- `classified_at` stamped
- `changes[]` populated (for `todo`) or empty (for `noop`)

Print a one-line confirmation in your final message:
`Classified {version}: {todo|noop} ({N} files)`.
