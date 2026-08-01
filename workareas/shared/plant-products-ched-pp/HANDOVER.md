# HANDOVER — plant-products/CHED-PP journey-builder plan

The plan of record is **`backlog.json`** in this folder. It is machine-readable and iterable — a serial
build loop flips statuses and reads rulings from it. This file tells you how to use it. It does not
duplicate it.

Read `WHEN-YOURE-BACK.md` first for the decision log (newest on top).

## What exists now

| Artefact | What it is |
|---|---|
| `backlog.json` | **The plan.** 52 increments in dependency order, 2 done, 45 todo, 5 deferred. Plus `scopeDecisions` (SD-1..SD-14), `deviations` (DV-1..DV-18), `sequencingNotes` (12 ordering rules), `gaps` (G-A..G-I), `milestones` (m0..m5). |
| `increments/pp-*.json` | The 39 planner outputs, byte-identical to their entries in `backlog.json`. Edit `backlog.json`, not these — they are provenance. |
| `increments/MAPPING.json` | How each `pp-*` id relates to a source CHED-PP `inc-*` increment, with the planner briefs. Provenance. |
| `frontend-plan/SIBLING-SET-PLAN.md` | How `sets/plant-products/` is stood up as a sibling of `live-animals`. Increments cite it by heading. Adversarially verified against the repo. |
| `backend-schema/SCHEMA-DESIGN.md` + `obligation-field-map.md` | The backend design (D-1..D-20) and which schema field backs which journey area. |
| `recon/` | The four Phase-A maps: frontend platform, recipe cheat-sheet, backend model, CHED-PP requirements. |

Code already landed on the backend `spike/trace-to-requirements` branch: `a7961ac` (schema skeleton,
56 files under `uk.gov.defra.trade.imports.plantproducts`) and `75763b9` (Mongo repository wiring fix).
`mvn verify` is green — 449 unit tests, 184 integration tests. **No frontend code was written** — that
is the whole of the todo list.

## How to iterate on the backlog

```bash
# next buildable increment (all deps done, no gate in the way)
jq -r '[.increments[] | select(.status=="done") | .id] as $done
  | .increments[] | select(.status=="todo") | select(all(.dependsOn[]; . as $d | $done | index($d)))
  | .id + " " + .title' backlog.json | head -5

# read one increment in full — everything an implementor needs is in the object
jq '.increments[] | select(.id=="pp-007")' backlog.json

# every open question, by increment
jq -r '.increments[] | select((.openQuestions|length)>0) | .id + ": " + (.openQuestions|join(" | "))' backlog.json
```

A build loop marks progress by setting `status` to `done` and adding a `commit` field (the two backend
increments show the shape). Keep the array in dependency order; if you add an increment, give it the
next free `pp-` id and place it after everything it depends on.

Validate after any edit — these are the four checks the assembly ran, and they must stay clean:

```bash
jq empty backlog.json
jq -r '[.increments[].id] as $i | [.increments[].dependsOn[]] | unique | map(select(. as $d | ($i|index($d))==null))' backlog.json   # must be []
jq -r '[.increments[].id] as $i | [range(0;($i|length)) as $n | .increments[$n] | .dependsOn[] as $d | select(($i|index($d))>=$n) | .id]' backlog.json   # must be []
jq '.increments|length' backlog.json
```

## The two hard gates — do not walk past them

1. **`pp-012`** — a platform characterisation test for depth-3 nested collections. The engine has never
   been driven three levels deep (live-animals stops at two). Every m3 commodity increment depends on
   it. If it goes red, that is a platform finding to raise, not something to patch around inside a
   commodity page.
2. **`pp-021`** — `HALT-FOR-REVIEW`. The depth-3 commodity model gets built and characterised, then
   stops for your review before any page collects it. This mirrors the `inc-012` gate the source
   CHED-PP backlog already carried.

## What is not covered by a recipe

`gaps` in `backlog.json` lists nine (G-A..G-I), each naming the increments it bites. The headline is
**G-A: there is no "add a set" recipe** — `SIBLING-SET-PLAN.md` is effectively that recipe, written for
one set. If plant-products proves it, extracting `docs/add-a-set.md` from it is a worthwhile chore.
G-B (depth-3 collections) is the riskiest: it is unproven engine territory, which is why `pp-012`
exists.

## Scope of pass 1

The m0–m4 own-org manual happy path, built as a sibling set selected by a boot-time switch (one set per
Node process — co-residency is out of scope and recorded as such). Delegated authority, CSV upload, CUC
billing, file bytes and AV, address-book search, draft lifecycle, Article 72 and cloning are all m5:
carried as `noPlanner` stubs with their rulings intact, so they are visible but unplanned. Any stub
needs a planner run before it can be built — its `openQuestions` says so.

138 open questions sit across the planned increments. They are decisions for build time, not blockers
now; the ones worth reading before you start are on `pp-004`, `pp-007`, `pp-008` and `pp-012`.
