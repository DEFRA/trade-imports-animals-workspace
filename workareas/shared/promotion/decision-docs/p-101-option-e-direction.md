# p-101 option (e): fulfilment as the persisted source of truth

Direction captured from a voice design session with Sam on 2026-07-23. This is
the input brief for a Codex-authored plan (`p-101-option-e-plan.md`). It records
**Sam's rulings**, not a finished design.

## Where this came from

The option (d) exploration (`p-101-option-d.md`) kept Paul's evaluator unchanged
and asked whether the central `bridge/` re-keying could dissolve into the
features. Sam pushed further: the argument I under-weighted is **persisting the
fulfilment state itself**.

The concession I made in the session: I was wrong to say "keep the UUIDs out of
persistence because they are model-internal". The whole reason the UUIDs exist
is versioning / A-B testing, and a **UUID-keyed journey state is exactly what
preserves that signal** — a name is ambiguous across obligation versions, a UUID
is not. So persisting the fulfilment is the shape that protects the thing the
UUIDs are for.

## Sam's rulings

1. **Persist the fulfilment state as the single canonical source of truth.** No
   dual name-keyed + fulfilment split — Sam explicitly does not want the dual
   approach.

2. **Persisted shape** (Sam spitballing): a JSON object with its own id and a
   `fulfilment` key holding everything done so far, persisted to Mongo. Roughly
   `{ id: <uid>, fulfilment: [ … ] }`. Sam suspects `fulfilment` is an **array**;
   today it is a UUID-keyed **map** (`bridge/fulfilments.js`,
   `model/obligations/evaluator.js`). Settling array-of-entries vs map is an open
   encoding question — array is likely cleaner for versioning.

3. **Rehydrate** the journey by loading that fulfilment state straight back into
   the evaluator — no re-derivation on the hot path.

4. **Three persisted shapes, three backend endpoints. Mapping done in the
   frontend; the backend just exposes an endpoint per shape to receive and
   store:**
   - (a) the **fulfilment** (canonical);
   - (b) the **current** notification shape, mapped from the fulfilment (what we
     persist today);
   - (c) the **full-fat proposed** notification shape, mapped from the fulfilment
     (however we currently do it — may still be a JSON file today).

5. **Payoff ("detect"):** because the fulfilment carries obligation UUIDs, you
   can **detect when obligation versions have changed**, pull data out
   accordingly, and adapt the produced output. Persisting all three side by side
   lets you compare the two notification projections. This is the concrete
   versioning use case that justifies the UUIDs.

6. **Empty in-progress records: fine to lose.** "You've started adding something
   and you're not into anything and you won't persist that — that's okay, I'm
   happy to lose that." No special handling required.

7. **Non-obligation extras become optional obligations.** Rather than the
   special-cased feature-owned extras
   (`flow/obligation-source.js:64` — `documents: new Set(['uploadId','filename'])`),
   model the upload return (id / path / filename) as **optional obligations** in
   the manifest, so the fulfilment is complete and there is no special case.
   "Look at the existing shape of that … in the skeleton." Recon: a document
   record carries `uploadId` + `filename` (+ a transient `scanStatus` from the
   cdp-uploader scan poll, which is ephemeral and probably not an obligation).
   Sam: "we should be storing that, and maybe that's missing obligations rather
   than a special case."

   **The line Sam is holding:** adding optional obligations grows the **manifest**
   (`model/obligations/obligations.js`); it does **not** change the evaluator
   algorithm. Evaluator/model logic stays untouched, consistent with the
   original constraint.

8. **Codex plan first** — a design + build plan, not a build.

## Why this is the natural home for option (d)

If the store *is* UUID-keyed fulfilments, then "features speak UUID natively" is
no longer a translation — it is simply the persistence shape. Features own their
field↔UUID bindings; the fulfilment is the durable state; the two notification
shapes are downstream projections.

## Rulings — 2026-07-23 (round 2, all 4 plan open-items resolved)

1. **Backend branch.** Do NOT reuse an existing candidate branch. **Create a fresh
   backend branch whose name matches the frontend build branch name exactly**
   (cross-repo branch parity, CLAUDE.md rule 2). Whatever the frontend option-e
   build branch is named, the `trade-imports-animals-backend` branch takes the
   identical name.

2. **Encoding.** Implement the recommendation: **array-of-obligation-entries at
   rest** (decoded to the evaluator's unchanged map). Sam is stepping away —
   **build the codec, then STOP and get Sam to explicitly review the encoding
   before it is locked**, in case he wants it changed. This is a mandatory review
   checkpoint after increment 2.

3. **Declaration.** Confirmed it is the truth-attestation checkbox — "I confirm
   that I have reviewed and comply with this declaration and that the information
   submitted in this notification is true and correct" (`requiredOneOf`,
   `features/declaration/controller.js:19`). **Drop it from Mapper B**
   (`notification-mapper.js:450-451,473`). It becomes purely a transient
   submit-gate attestation — NOT a durable obligation, NOT notification data.
   This resolves the single-source tension the plan flagged.

4. **Id-minting.** **A new noun resource owns fulfilment persistence and mints the
   id.** Decouple id minting from `POST /notifications`; the canonical fulfilments
   resource owns identity, and the two notification projections are keyed by that
   id.

Resolved-from-code items (unchanged): keep `scanStatus` transient; accept loss of
empty started records; all answered obligation values + the new upload-return
obligations must round-trip.
