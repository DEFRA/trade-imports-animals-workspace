# Common Reference — NPM Upgrade

Shared reference for all npm-upgrade personas.

---

## Prerequisites

- VPN connected (Defra/Artifactory access)
- On the feature branch with a clean working directory
- Node version correct (nvm use)

---

## Scripts

All run from `~/git/defra/eudp-live-animals/eudp-live-animals-utils/agents`:

| Script | Phase | Purpose |
|--------|-------|---------|
| `tools/npm/discover-upgrades.sh` | 1 | Find outdated packages, create stubs |
| `tools/npm/upgrade-status.sh` | All | Combined status across phases |
| `tools/npm/run-automated-upgrades.sh` | 2 | Run automated upgrades for one repo |
| `tools/npm/discover-manual-upgrades.sh` | 3 | List `.manual.md` plans |

---

## File Extensions (Classification Signal)

- `upgrade__{pkg}.md` — unclassified stub (zero-byte, pending PLANNER)
- `upgrade__{pkg}.auto.md` — no code changes required, safe to automate
- `upgrade__{pkg}.manual.md` — code changes required, human must implement

Phase 2 implementation markers (in `workareas/npm-implementations/{run-id}/{repo}/`):
- `.todo` → `.inprogress` → `.done` / `.failed`

---

## Failure Types

| Type | Cause | Action |
|------|-------|--------|
| Connectivity | VPN/Artifactory down | Stop, report to user |
| Baseline failure | Repo tests already broken | Stop, report — not an upgrade issue |
| Install failure | Peer conflict etc. | Auto-demote to `.manual.md` |
| Test failure after upgrade | Breaking change | Rollback, auto-demote to `.manual.md` |
| Cascade failure | Rollback itself fails | Stop immediately, report |

---

## Global Rules

- Never push commits — all changes stay local until human review
- Never skip test runs
- Summaries in reports, not full logs
