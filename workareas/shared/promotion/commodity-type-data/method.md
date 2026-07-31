# Commodity "type of commodity" data — reconstruction + validation

Reconstructs the real per-commodity **type of commodity** data (types + the
species under each type) for the four live-animal commodity codes the
prototype offers, straight from the IPAFFS commoditycode microservice's own
data, and validates the method against the two known-good frontend fixtures.

Nothing here is invented. Every value is read from the authoritative BCP data
repo `ipaffs-commodity-code-data` (the extract that seeds the microservice),
snapshot dated **2023-10-10** (`sync_date.txt` = 11/10/2023).

## The four codes

| Code | Animal | Result |
|------|--------|--------|
| `0101` | Horse | 1 blank type, 3 species (validation anchor) |
| `0102` | Cow / bovine | 2 types: Domestic + Game (validation anchor) |
| `01061900` | Cat / Dog ("Other") | 1 blank type, 92 species |
| `0301` | Fish (live) | 1 blank type, **no species** (empty-tree fallback) |

## The join (reconstructed from the SQL view + function)

Source logic read from the microservice:
- `configuration/database/src/main/resources/views/commodity_category_view.sql`
- `configuration/database/src/main/resources/functions/fn_commodity_category_data.sql`

The view resolves a commodity code to a certification requirement, then the
T-SQL function walks `certification_nomenclature` to build the type → class →
family → model → species tree. The animal (CVEDA) path is:

```
commodity_nomenclature.traces_commodity_code = <code>
    -> commodity_nomenclature.Code                                  (cnCode)
certification_requirement.CommodityNomenclatureId_Code = cnCode
    AND certification_requirement.CertificationRequirement_Code = 640   (640 = CVEDA)
    -> certification_requirement.Code                               (reqPK)
certification_nomenclature.CertificationRequirement_Code = reqPK
    -> the type/species rows
```

`fn_commodity_category_data(@certification_requirement_code = reqPK,
@certification_type = 640, @traces_commodity_code = <code>)`. Because the
certificate is CVEDA (640, not 851 = CHED-PP), the function filters to rows
where `CommodityType_ID IS NOT NULL`.

Per-field build inside the function (mirrored exactly here):
- **types** = distinct `CommodityType_Name` (normalised: `Blank/Empty`/NULL → `""`),
  value = `CommodityType_ID`.
- **species under a type** = distinct `Species_Name` / `Species_ID` for rows
  carrying that `CommodityType_ID` (roll-up of the model→family→class→type chain).
- **empty tree** → the function's pseudo-data branch: a single blank type whose
  value is the commodity code itself, and an empty species list.

### Tables / files used (all from `ipaffs-commodity-code-data`, materialised via git-lfs)

| View (BCP file) | Rows | Role | Key columns (1-based, per `.fmt`) |
|---|---|---|---|
| `vw_CommNom_CommodityNomenclature` | 27,217 | code → Code | 32 TracesCommodityCode, 8 Code |
| `vw_CertNom_Certificate` | 5 | CVEDA = 640 | 8 Code, 15 ShortDescription |
| `vw_CertNom_CertificationRequirement` | 11,358 | Code → reqPK | 8 Code, 10 CertificationRequirement_Code (cert FK), 14 CommodityNomenclatureId_Code |
| `vw_CertNom_CertificationNomenclature` | 452,253 | the tree | 10 CertificationRequirement_Code, 14 CommodityType_Name, 15 CommodityType_ID, 16 IsDefaultCommodityType, 27 Species_Name, 28 Species_ID |

Data format: BCP character export, **`||`** field terminator, newline row
terminator, UTF-8 with a leading BOM and occasional Latin-1 bytes (so `grep -a`).
The test CSVs under the microservice repo
(`service/src/test/resources/integration/data/*.csv`) are a **curated subset**
that does **not** contain any of the four codes' trees — hence the full LFS
extract was required.

### Resolved CVEDA requirement PKs (from the 2023-10-10 production data)

| Code | reqPK |
|---|---|
| `0101` | `9A36CC3B-5268-9A1E-8350-488C171A39DD` |
| `0102` | `9411ACDA-F682-56F5-FCCF-68906BEB4272` |
| `01061900` | `26DE075B-2A2A-81C1-7409-90BD837F2CA6` |
| `0301` | `36F102FC-F54B-C58C-AD78-6AD5CBE682E5` (0 tree rows → fallback) |

Note: the **stale test CSV** used different PKs (e.g. `FE3C9DCC…` for 0102,
which in production is now the EU-Import-Notification requirement). PKs were
therefore re-resolved from the production data end-to-end for self-consistency.

## Tool

Pure Node (no deps) over a pre-grepped 106-row extract of the 176 MB tree file
(`certnom-extract.txt`, grepped for the four reqPKs). Script:
`reconstruct.js` (both copied into this folder). Run:
`npm --prefix <dir> run run`. duckdb was unavailable via npx in this env; a
`||`-split Node parser mirrors the T-SQL function faithfully.

## VALIDATION GATE — result: method PROVEN

The reconstruction was run for `0101` and `0102` and compared to the frontend
fixtures `commodity-categories-0101.json` / `-0102.json`.

**`0102` (the richer anchor) — exact structural + content match:**
- Types: **Domestic (id 16) + Game (id 24)** — reproduced EXACTLY (ids included).
- Domestic species: `Bison bison`, `Bos taurus`, `Bubalus bubalis` — EXACT match.
- Game species: same 8 taxa; only difference is punctuation normalisation in
  the newer snapshot (`Bison spp` → `Bison spp.`, `Bubalus spp (including Anoa)`
  → `Bubalus spp. (including Anoa)`).

**`0101` — structure match:**
- Exactly ONE blank-text type, 3 species — reproduced.
- The three equine taxa are the same (donkey / horse / hybrid); the newer
  snapshot corrects the spelling (`Equus cabalus` → `Equus caballus`,
  `Eq cabalus*asinus` → `Equus caballus*asinus`).
- The blank-type id differs: fixture `1908` vs current `2`.

**Independent cross-check for the unknown `01061900`:** the separate fixture
`01061900-imp.json` records `species_id 190409 = "Felis catus"`. The
reconstruction independently produces `Felis catus` at species_id **190409** —
an EXACT match, confirming the join yields correct current-snapshot species IDs
for the cat/dog code.

### The one caveat: data-snapshot drift (NOT a method error)

The two frontend fixtures were generated from an **older** data snapshot than
the 2023-10-10 LFS extract. Consequently:
- **Species `value` (species_id) numbers differ** between the fixtures and the
  current data (e.g. Game `Poephagus spp.` = fixture `52999` vs current `67180`).
  The fixture's ids (`4799`, `65700`, `3130-3132`, `1908`, …) belong to that
  older snapshot and do not exist in the current data.
- Minor species-name **spelling/punctuation** was cleaned up.
- The `0101` blank-type id moved `1908` → `2`.

These are attributable purely to the snapshot date, not to the join: where the
snapshots align, the reproduction is exact — 0102's type ids 16/24, 0102's
Domestic species names, and the 01061900 `Felis catus = 190409` cross-check.
The **type structure and species membership** (what the promotion programme
needs) reproduce faithfully for both anchors.

## Why 01061900 and 0301 are real, not invented

Both were produced by the **same validated join** against the same 2023-10-10
data, with no manual entry:
- **`01061900`** — 1 blank type, 92 species (cats `Felis catus`, dogs
  `Canis familiaris`, ferret `Mustela putorius furio`, plus the wild-mammal
  list incl. `Other Carnivora`/`Other Lagomorpha`/`Other Rodentia`). The
  `Felis catus = 190409` value is independently confirmed by `01061900-imp.json`.
- **`0301`** — the CVEDA requirement (`36F102FC…`) has **zero**
  `certification_nomenclature` rows (verified against the full 452k-row file;
  the CVEDP requirement `22757597…` is also empty). By the function's
  documented pseudo-data branch, an empty tree yields a single blank type whose
  value is the commodity code (`0301`) and **no species**. That is the real
  microservice output for live fish at the `0301` heading, not an omission.

## Files in this folder
- `commodity-types.json` — the validated output for all four codes.
- `certnom-extract.txt` — the 106 source rows (evidence).
- `reconstruct.js` — the reconstruction + validation script.
- `method.md` — this file.
