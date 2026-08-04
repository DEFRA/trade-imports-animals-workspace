# Repository Review: trade-imports-animals-frontend

**PR:** #163
**Commit:** c0d014a
**Files Changed:** 2

## Summary

Three added lines pinning npm to 11.6.2 via `engines.npm` and `packageManager`, so Dependabot and CI agree on a version. The pin is factually correct — `.nvmrc` is Node 24.11.1 and that release bundles npm 11.6.2 — and the exact-version style matches the repo's `save-exact=true` convention. Note this commit is labelled EUDPA-299, not EUDPA-58; it was swept into this review by PR discovery.

## Positive Observations

- The pinned version was verified against the actual Node release rather than asserted.
- The lockfile change is npm mirroring the new `engines` block only — no dependency or version movement, so no new CVE surface.

## Test Coverage

Not applicable — configuration-only change with no behaviour to test.

## Risk Assessment

**Overall Risk:** Low
**Rationale:** Advisory-only pin with no runtime effect. The two Minor findings are that nothing enforces it (`engine-strict` is unset and neither CI nor the Dockerfile installs that npm), so a Node bump would silently reintroduce the divergence this was meant to fix.
## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `package-lock.json` | SAFE | 0 | 0 | 0 |
| `package.json` | SAFE | 0 | 0 | 2 |
| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | package.json | 10 | Minor | build-config | engines.npm is advisory only - .npmrc has no engine-strict=true and neither CI (setup-node + npm ci) nor the Dockerfile installs npm 11.6.2, so the pin only holds while the Node image happens to bundle it (Node 24.11.1 does today) | Add engine-strict=true to .npmrc so an npm/Node drift fails loudly, or install npm@11.6.2 explicitly in CI and the Dockerfile |  |  |  |
| 2 | package.json | 12 | Minor | supply-chain | packageManager is set without a Corepack integrity hash, so any Corepack-enabled environment resolves and downloads npm 11.6.2 unverified at first invocation | Run 'corepack use npm@11.6.2' to write the hashed form (npm@11.6.2+sha512...), or drop packageManager if only the Dependabot alignment is wanted and engines.npm alone suffices |  |  |  |

## Consistency Check

See [file-reviews/trade-imports-animals-frontend/_consistency-check.md](file-reviews/trade-imports-animals-frontend/_consistency-check.md).

## Repository Verdict

**Status:** SAFE
