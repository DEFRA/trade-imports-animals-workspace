# p-205 — typeOfCommodity: where the real data lives, and what UI it demands

Companion to backlog items p-001 (implemented, held) and p-205. Feeds the
pending PO decision on c-037 (the prototype's drop of typeSelection).

## At a glance

- **Verdict:** a commodity can have more than one type. The real MDM data
  proves it — `0102` alone is Domestic + Game. So the single-option
  assumption is wrong.
- **Why it matters:** c-037 assumes species search subsumes type. That
  premise is disproven. Dropping the type select loses a real filter.
- **What you need to weigh in on:** restore the conditional type select
  (legacy/V4 pattern), and decide its timing against landing p-001's
  derive-and-emit work.

## Verdict

Blanket system-derivation of typeOfCommodity is not safe.

The old journey's single "Domestic" option is a canned-data artifact. Real
MDM data has multiple types per commodity. That includes `0102` itself,
which carries both Domestic and Game.

## Where IPAFFS gets the data

The trace runs from the UI handler to DEFRA's central MDM. It has three
hops.

**1. The UI handler asks for categories per commodity.**

`ipaffs-frontend-notification/service/src/routes/handlers/importer/commodity_details.js:191`
→ `utils/commodities.js:37-47`.

**2. That triggers an integration call.**

`GET {commodityCodeUrl}/commodity-categories/{certType}-{commodityCode}`
(`service/src/integration/commodity_code.js:163-175`), served by
**`ipaffs-commoditycode-microservice`**.

**3. The microservice's database is loaded from MDM.**

The source is DEFRA's central **MDM** (Master Data Management) staging
views — see `ipaffs-commodity-code-data/`:

- `[ReferenceDataStaging].[mdm].vw_CertNom_CommodityType` — the
  type-of-commodity table
- `vw_BioTax_Species*` — species taxonomy
- `vw_CommNom_*` — commodity nomenclature

The data is stored as bcp extracts under git-lfs. The pointers are checked
in; run `git lfs pull` to materialise them. Last synced **2023-10-11**
(`sync_date.txt`).

## The evidence that multi-type is real

- `ipaffs-frontend-notification/service/test/data/commodity-categories-0102.json:4`
  — `0102` has **two** types: Domestic (16) and Game (24). Each heads its
  own class/family/species hierarchy:
  - Domestic → Bison bison, Bos taurus, Bubalus bubalis
  - Game → Bibos spp, Bison spp, Bos spp, Bubalus spp, Novibos spp, Ovibos
    spp, Poephagus spp., Syncerus spp
- `commodity-categories-02089030.json:4` — a CHED-P commodity with
  **five** types.
- `commodity-categories-0101.json` — horses: exactly one type with blank
  text. This is the genuinely-single case.
- The QA suite drives real multi-type selects:
  `ipaffs-qa-automation/types/commodity-type.ts:1-6`,
  `ched-p-workflows.ts:294,686,871`.
- The workspace's `mock-species.json` is a mangled trim. It keeps Domestic
  only, but its `classes` array still dangles a reference to deleted type
  "24" (Game).

## What the legacy UI does

The legacy UI treats the type field as a conditional filter, not a fixed
value. See
`ipaffs-frontend-notification/service/src/views/importer/consignmentCommodityAttributes.html:46-69`:

- Exactly one type AND blank text → hidden input. No question is asked.
- Otherwise → a visible "Type of commodity" `govuk-select` that acts as a
  FILTER. Choosing a type refilters class → family → species
  (`consignment_commodity_attributes.js:298-306`). A noscript update button
  covers no-JS. Changing type resets the downstream picks.

A commodity line is therefore always type-homogeneous.

Confluence V4 (`extract.confluence-v4.json:147-158`) describes the same
thing: typeSelection, MDM-sourced single-select, "where applicable for
given commodity, user is able to filter species by type", example "Game".

## Sources for realistic data, cheapest first

**1. Lift the ready-made fixtures.** Copy
`ipaffs-frontend-notification/service/test/data/commodity-categories-*.json`
into the prototype's canned commodity data — real hierarchy, real ids,
zero infrastructure. This replaces the mangled `mock-species.json`
lineage.

**2. Materialise the full MDM snapshot.** Run `git lfs pull` in
`ipaffs-commodity-code-data`, then regenerate canned data for any
commodity from the real extracts. The 2023 snapshot is fine for
prototyping, but stale for production.

**3. Go promotion-proper.** The new reference-data service grows a
commodity-categories surface fed from MDM. Today it serves only countries
and ports of entry. This matches the standing ruling "options come from
real MDM integrations, never a static list". Lane E / backend workstream.

## Open decision (Sam + PO)

Species-based derivation is not credible — Sam's position, 2026-07-22.

The remaining option is to restore the conditional type select. It follows
the legacy/V4 pattern: hidden when single-blank, visible filter when
multiple. Use realistic data from source 1.

You then need to decide the timing of that against landing p-001's
derive-and-emit work, which restores payload parity for the canned world
both journeys share today.

c-037's "type is subsumed by species search" premise is disproven. The PO
sign-off must see this document.
