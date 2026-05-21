# govuk-frontend Upgrade Orchestrator

**Entry point** for upgrading govuk-frontend across EUDP Live Animals repositories.

**Triggers:** "upgrade govuk-frontend", "govuk upgrade", "govuk-frontend upgrade"

---

## Repos

govuk-frontend is used in 2 of the 4 EUDP Live Animals repos:

- `trade-imports-animals-frontend` — `~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend`
- `trade-imports-animals-admin` — `~/git/defra/trade-imports-animals/repos/trade-imports-animals-admin`

---

## Step 1: Establish Run ID

```bash
git -C ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend branch --show-current
```

Parse `EUDPA-XXXXX` from the branch name (e.g. `feature/EUDPA-20578-...` → `EUDPA-20578`). If not found, ask the user.

---

## Step 2: Branch Setup

For each of the 2 repos, ensure it's on `feature/{run-id}-govuk-frontend-upgrade`:

```bash
# Check
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} branch -a | grep "feature/{run-id}-govuk-frontend-upgrade"

# Create if missing
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} checkout -b "feature/{run-id}-govuk-frontend-upgrade"

# Switch if exists
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} checkout "feature/{run-id}-govuk-frontend-upgrade"
```

Both repos must be on the feature branch before continuing.

---

## Phase 1: Version Discovery

Spawn a single **PHASE_1_MANAGER** agent:

```
Follow personas/govuk-upgrade/PHASE_1_MANAGER.md.

Run ID: {run-id}
```

Present its report verbatim. **Gate:** "Phase 1 complete. Proceed to Phase 2 (changelog analysis)?"

---

## Phase 2: Changelog Analysis and Planning

Spawn a single **PHASE_2_MANAGER** agent:

```
Follow personas/govuk-upgrade/PHASE_2_MANAGER.md.

Run ID: {run-id}
```

Present its report verbatim. **Gate:** "Phase 2 complete. Proceed to Phase 3 (implementation)?"

If any versions are marked INCOMPLETE, flag them and ask how to handle before proceeding.

---

## Phase 3: Implementation

Spawn a single **PHASE_3_MANAGER** agent:

```
Follow personas/govuk-upgrade/PHASE_3_MANAGER.md.

Run ID: {run-id}
```

Present its report verbatim. This is the end of automated work.

---

## Failures

Surface any error to the user with the raw output. Do not retry or problem-solve. Wait for instruction.
