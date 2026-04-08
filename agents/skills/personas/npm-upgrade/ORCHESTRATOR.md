# NPM Upgrade Orchestrator

**Entry point** for npm dependency upgrades across EUDP Live Animals repositories.

**Triggers:** "upgrade npm dependencies", "run npm upgrades"

---

## Repos

All 4 EUDP Live Animals repos at `~/git/defra/trade-imports-animals/repos/{repo-name}`:

- trade-imports-animals-frontend
- trade-imports-animals-backend
- trade-imports-animals-tests
- trade-imports-animals-admin

---

## Step 1: Establish Run ID

```bash
git -C ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend branch --show-current
```

Parse `EUDPA-XXXXX` from the branch name (e.g. `feature/EUDPA-20578-...` → `EUDPA-20578`). If not found, ask the user.

---

## Step 2: Branch Setup

For each repo, ensure it's on `feature/{run-id}-npm-dependency-upgrades`:

```bash
# Check
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} branch -a | grep "feature/{run-id}-npm-dependency-upgrades"

# Create if missing
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} checkout -b "feature/{run-id}-npm-dependency-upgrades"

# Switch if exists
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} checkout "feature/{run-id}-npm-dependency-upgrades"
```

All 4 repos must be on the feature branch before continuing.

---

## Phase 1: Planning

Spawn a single **PHASE_1_MANAGER** agent:

```
Follow personas/npm-upgrade/PHASE_1_MANAGER.md.

Run ID: {run-id}
```

Present its report verbatim. **Gate:** "Phase 1 complete. Proceed to Phase 2?"

---

## Phase 2: Automated Upgrades

Spawn a single **PHASE_2_MANAGER** agent:

```
Follow personas/npm-upgrade/PHASE_2_MANAGER.md.

Run ID: {run-id}
```

Present its report verbatim. **Gate:** "Phase 2 complete. Proceed to Phase 3 handoff?"

If cascade failures are reported, flag them and ask how to handle before proceeding.

---

## Phase 3: Handoff Report

Spawn a single **PHASE_3_MANAGER** agent:

```
Follow personas/npm-upgrade/PHASE_3_MANAGER.md.

Run ID: {run-id}
```

Present its report verbatim. This is the end of automated work.

---

## Failures

Surface any error to the user with the raw output. Do not retry or problem-solve. Wait for instruction.
