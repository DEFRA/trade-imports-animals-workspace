---
name: review-snyk
description: 'Snyk CLI scan and fix for EUDPA PRs — OSS deps, Snyk Code, container/Dockerfile. Triggers: "snyk review EUDPA-X", "snyk scan EUDPA-X", "run snyk on EUDPA-X". Part of review FRESH Step 3.5. NOT for full code review (review) or AC-only (ac-check).'
disable-model-invocation: true
---

# Snyk gate (review stage)

Run **Snyk CLI** against each repo in the ticket's PR set: open-source
dependencies, **Snyk Code** (SAST), and **container** scans via
`Dockerfile`. Attempt **`snyk fix`** for supported OSS ecosystems; container
base-image updates are applied manually from scan output.

Parent: `../SKILL.md` — runs inside the review workflow after file-review
coverage (FRESH Step 3.5) or standalone via trigger above.

## Conventions

One command per Bash call; literal `~/git/defra/trade-imports-animals-workspace/...`
paths. Full rules: `~/git/defra/trade-imports-animals-workspace/docs/agent-skills.md`.

## Prerequisites

1. **Review workspace** — `start-review.sh` has run (`workareas/reviews/EUDPA-X/`).
2. **Snyk CLI** — `brew install snyk/tap/snyk`
3. **Auth** — `snyk auth` once, or `export SNYK_TOKEN=...` in the shell
4. **Workspace repos** — `make setup` (fixes apply to `repos/<repo>` on the PR branch)

If auth or CLI is missing, `start-snyk.sh` prints `MODE: SNYK_SKIP` — log
it and continue the review without blocking.

## Step 0: Scan (+ optional auto-fix)

```bash
~/git/defra/trade-imports-animals-workspace/tools/snyk/start-snyk.sh EUDPA-XXXXX --fix
```

Omit `--fix` for scan-only. Output:

- `workareas/reviews/EUDPA-XXXXX/snyk-report.md` — human summary
- `workareas/reviews/EUDPA-XXXXX/snyk/*.json` — raw Snyk JSON per scan

## Step 1: Triage remaining findings

Read `snyk-report.md`. For each repo not clean:

1. **OSS** — read `snyk/{repo}-oss.json`; `snyk fix` may have upgraded
   lockfiles. Remaining issues → note or add review items (Critical/High).
2. **Code** — read `snyk/{repo}-code.json`; fix in source or mark Won't Fix
   with rationale if false positive.
3. **Container** — read `snyk/{repo}-container-*.json`; bump `FROM` base
   image in the `Dockerfile` when Snyk recommends a patched tag. Re-run:

```bash
~/git/defra/trade-imports-animals-workspace/tools/snyk/scan-repo.sh EUDPA-XXXXX --repo {repo}
```

Optional — log Critical/Major items in the review table:

```bash
~/git/defra/trade-imports-animals-workspace/tools/review/review-add-item.sh EUDPA-XXXXX \
    --repo {repo} --file {path} --line {line} --severity Critical \
    --category snyk --issue "..." --fix "..."
```

(Only after `aggregate-file-reviews.sh --write-items` if items JSON must exist.)

## Step 2: Tests after fixes

If `--fix` or manual Dockerfile edits changed files, run the repo's tests
(npm test / mvn verify) before presenting the diff.

## Step 3: Commit gate (developer review)

**Never commit automatically.** Present per-repo `git status --short` and
`git diff --stat` from `repos/<repo>`. Wait for developer approval, then
commit per `docs/git-conventions.md` — no agent references:

```bash
git -C ~/git/defra/trade-imports-animals-workspace/repos/{repo} commit -m "fix(EUDPA-XXXXX): address Snyk findings"
```

## Step 4: Completion

```
Snyk gate complete for EUDPA-XXXXX.

Verdict: [SNYK CLEAN | SNYK FINDINGS]
Repos: [list with clean yes/no]
Report: ~/git/defra/trade-imports-animals-workspace/workareas/reviews/EUDPA-XXXXX/snyk-report.md

If lockfiles or Dockerfiles changed, consider refresh review on those files.
Next: continue review (consistency / summaries) or walk review EUDPA-XXXXX
```

## Scripts

| Script | Purpose |
|---|---|
| `tools/snyk/start-snyk.sh` | Orchestrator — sync, scan, optional `--fix`, write report |
| `tools/snyk/scan-repo.sh` | One repo — OSS + code + container JSON |
| `tools/snyk/apply-fixes.sh` | `snyk fix` + re-scan |
| `tools/snyk/sync-workspace-repo.sh` | Checkout PR head on `repos/<repo>` |
| `tools/snyk/detect-targets.sh` | Find package.json / pom.xml / Dockerfiles |
| `tools/snyk/ensure-auth.sh` | CLI + auth check |

## Cursor vs Claude Code

Single session — no Task fan-out. Snyk runs can take several minutes per repo.
